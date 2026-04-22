let tableBody;
let selectedRizika = [];
let selectedOpatreni = {}; 
//                                                                                                              ================= IMPORT ===================

document.getElementById('importFile').addEventListener('change', function(e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {

        fetch('/import-json/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN
            },
            body: event.target.result
        })
        .then(res => res.json())
        .then(data => fillForm(data));

    };

    reader.readAsText(file);
});

function fillForm(data) {

    // 🔥 AUTOMATICKÉ vyplnění všech inputů
    for (const key in data) {

        const input = document.querySelector(`[name="${key}"]`);

        if (input) {
            input.value = data[key];
        }
    }

    // ===== SPECIÁLNÍ VĚCI =====

    // 🖼 obrázek
    if (data.obrazek_data) {
        document.getElementById('fotoCell').innerHTML =
            `<img src="${data.obrazek_data}" style="max-width:100%;">`;

        document.getElementById('obrazekData').value = data.obrazek_data;
    }

    // pracovníci
    if (data.pracovnici) {

        const tableBody = document.getElementById('pracovniciTable');
        tableBody.innerHTML = "";

        // 🔥 použij EXISTUJÍCÍ funkci
        data.pracovnici.forEach(item => addRow(item));

        // 🔥 KLÍČOVÝ ŘÁDEK (prázdný na konec)
        addRow();
    }
    
    // ===== RIZIKA + OPATŘENÍ =====
    if (data.rizika) {

        selectedRizika = [];
        selectedOpatreni = {};

        data.rizika.forEach(item => {

            const riziko = item.riziko;

            // 👉 přidej do seznamu rizik
            selectedRizika.push(riziko);

            // 👉 přidej opatření
            if (item.opatreni && item.opatreni.length) {
                selectedOpatreni[riziko] = item.opatreni;
            }
        });

        // 👉 vykresli tabulku
        renderRizikaTable();
        renderPodpisTable();
    }
} 
//                                                                                                                                  ============== RIZIKA ==============

function openRizika() {

    const modal = document.getElementById('rizikaModal');
    const list = document.getElementById('rizikaList');

    list.innerHTML = "";

    for (const key in rizikaData) {

        const checked = selectedRizika.includes(key) ? "checked" : "";

        const item = document.createElement('div');

        item.innerHTML = `
            <label class="riziko-item">
                <span>${rizikaData[key].label}</span>
                <input class="checkbox" type="checkbox" value="${key}" ${checked}>
            </label>
        `;

        list.appendChild(item);
    }

    modal.style.display = "flex";
}

function closeRizika() {
    document.getElementById('rizikaModal').style.display = "none";
}

function saveRizika() {

    const checkboxes = document.querySelectorAll('#rizikaList input');

    selectedRizika = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    renderRizikaTable();

    closeRizika();
}

function renderRizikaTable() {

    const tbody = document.getElementById('rizikaTable');
    tbody.innerHTML = "";

    selectedRizika.forEach(riziko => {

        const row = document.createElement('tr');

        const td1 = document.createElement('td');
        td1.textContent = rizikaData[riziko].label;
        td1.colSpan = 2;

        const td2 = document.createElement('td');
        const opatreni = selectedOpatreni[riziko] || [];
        td2.innerHTML = opatreni.map(item => "- " + item).join("<br>");
        td2.colSpan = 2;
        td2.style = "padding-left: 10px;"

        row.appendChild(td1);
        row.appendChild(td2);

        tbody.appendChild(row);
    });
}

function openOpatreni() {

    const modal = document.getElementById('opatreniModal');
    const list = document.getElementById('opatreniList');

    list.innerHTML = "";

    selectedRizika.forEach(riziko => {

        const wrapper = document.createElement('div');
        wrapper.classList.add('opatreni-wrapper');
        

        const title = document.createElement('h3');
        title.textContent = rizikaData[riziko].label;

        wrapper.appendChild(title);

        const selected = selectedOpatreni[riziko] || [];

        rizikaData[riziko].opatreni.forEach(op => {

            const checked = selected.includes(op) ? "checked" : "";

            const item = document.createElement('div');
            item.classList.add('opatreni-item')

            item.innerHTML = `
                <label class="riziko-item">
                    <span>${op}</span>
                    <input class="checkbox" type="checkbox" data-riziko="${riziko}" value="${op}" ${checked}>
                </label>
            `;

            wrapper.appendChild(item);
        });

        list.appendChild(wrapper);
    });

    modal.style.display = "flex";
}

function closeOpatreni() {
    document.getElementById('opatreniModal').style.display = "none";
}

function saveOpatreni() {

    selectedOpatreni = {};

    const checkboxes = document.querySelectorAll('#opatreniList input');

    checkboxes.forEach(cb => {

        if (!cb.checked) return;

        const riziko = cb.dataset.riziko;

        if (!selectedOpatreni[riziko]) {
            selectedOpatreni[riziko] = [];
        }

        selectedOpatreni[riziko].push(cb.value);
    });

    renderRizikaTable();

    closeOpatreni();
}

function getRizikaData() {

    return selectedRizika.map(riziko => ({
        riziko: riziko,
        opatreni: selectedOpatreni[riziko] || []
    }));
}

const rizikaData = {
    "pad_z_vysky": {
        label: "Pád z výšky",
        opatreni: [
            "OOPP proti pádu",
            "Periodická prohlídka OOPP",
            "Kontrola OOPP před použitím",
            "Vhodné počasí",
            "Zhodnocení stromu před prací",
            "Školení pro práci ve výškách",
            "Plán práce",
            "Analýza rizik",
            "Dodržení návodu k použití",
            "Dozor druhé osoby",
            "Vhodně zvolený žebřík",
            "Zajištění žebříku"
        ]
    },

    "dest": {
        label: "Déšť",
        opatreni: [
            "Sledování předpovědi",
            "Krátkodobá práce",
            "Výměna mokrého vybavení"
        ]
    },

    "sklouznuti": {
        label: "Sklouznutí",
        opatreni: [
            "Vhodná obuv",
            "Očištěná obuv",
            "Změna času práce"
        ]
    },

    "snih": {
        label: "Sníh",
        opatreni: [
            "Sledování předpovědi",
            "Krátkodobá práce",
            "Výměna mokrého vybavení",
            "Vhodné rukavice",
            "Častější přestávky"
        ]
    },

    "zima": {
        label: "Zima",
        opatreni: [
            "Sledování předpovědi",
            "Krátkodobá práce",
            "Teplé oblečení",
            "Vhodné rukavice",
            "Častější přestávky"
        ]
    },

    "teplo": {
        label: "Teplo",
        opatreni: [
            "Dostatek tekutin",
            "Tekutiny ve stromě",
            "Krátkodobá práce"
        ]
    },

    "vitr": {
        label: "Vítr",
        opatreni: [
            "Sledování předpovědi",
            "Zvětšení pracovního prostoru",
            "Přerušení práce nad 12 m/s"
        ]
    },

    "stav_stromu": {
        label: "Stav stromu",
        opatreni: [
            "Odborné hodnocení stromu",
            "Vizuální kontrola stromolezcem"
        ]
    },

    "hmyz": {
        label: "Hmyz",
        opatreni: [
            "Změna času práce",
            "Zapěnění otvoru",
            "Antialergika",
            "Kontrola alergie pracovníka"
        ]
    },

    "elektrina": {
        label: "Elektrické vedení",
        opatreni: [
            "Vypnutí energetiky",
            "Zakrytí vedení",
            "Použití laminátového teleskopu"
        ]
    },

    "majetek": {
        label: "Majetek pod stromem",
        opatreni: [
            "Odstranění majetku",
            "Zakrytí majitelem",
            "Zakrytí firmou",
            "Spouštění materiálu lanem",
            "Kontrolovaný shoz"
        ]
    },

    "doprava": {
        label: "Doprava",
        opatreni: [
            "Výstražné cedule",
            "Kužely",
            "Pozemní pracovníci",
            "Řízení dopravy",
            "Vysílačky",
            "Práce mimo špičku",
            "Externí firma"
        ]
    },

    "chodci": {
        label: "Pohyb osob",
        opatreni: [
            "Trvalý dozor",
            "Vyznačení páskou",
            "Zablokování prostoru",
            "Informování obyvatel",
            "Výstražné oblečení"
        ]
    },

    "rezani": {
        label: "Řezání",
        opatreni: [
            "Použití OOPP",
            "Vhodný výběr pily",
            "Školení"
        ]
    },

    "poskozeni_vybaveni": {
        label: "Poškození vybavení",
        opatreni: [
            "Záložní vybavení"
        ]
    },

    "ptaci_hnizdo": {
        label: "Ptačí hnízdo",
        opatreni: [
            "Změna termínu",
            "Komunikace s ornitologem"
        ]
    },

    "pad_materialu": {
        label: "Pád materiálu",
        opatreni: [
            "Zajištění materiálu",
            "Vyloučení pohybu pod stromem",
            "Helmy",
            "Domluvený prostor dopadu"
        ]
    },

    "signal": {
        label: "Bez signálu",
        opatreni: [
            "Telefon s jiným operátorem",
            "Záchranný plán"
        ]
    },

    "teren": {
        label: "Nestabilní terén",
        opatreni: [
            "Komunikace s majitelem",
            "Vyznačení nebezpečného místa"
        ]
    },

    "popaleniny": {
        label: "Popáleniny",
        opatreni: [
            "Vhodné oblečení",
            "Rukavice"
        ]
    },

    "zrak": {
        label: "Poškození zraku",
        opatreni: [
            "Štít",
            "Brýle"
        ]
    },

    "stepkovac": {
        label: "Štěpkovač",
        opatreni: [
            "Seznámení s návodem",
            "Proškolení",
            "Použití OOPP"
        ]
    },

    "plosina": {
        label: "Plošina",
        opatreni: [
            "Výběr vhodné plošiny",
            "Proškolení obsluhy",
            "Revize zařízení",
            "Kontrola před použitím"
        ]
    }
};

//                                                                                                                                       ============== CANVAS ================

const canvas = new fabric.Canvas('canvas', {
    backgroundColor: 'white'
});

window.addEventListener('resize', function() {
    if (document.getElementById('editorModal').style.display === 'flex') {
        resizeCanvas();
    }
});

//                                                                                                                                              === STAV ===
let fileDialogOpened = false;
// === OTEVŘENÍ EDITORU ===
function openEditor() {
    const modal = document.getElementById('editorModal');
    modal.style.display = 'flex';

    resizeCanvas();

    // 👇 pokud ještě není obrázek → otevřít dialog
    if (!canvas.backgroundImage) {
        fileDialogOpened = true;

        setTimeout(() => {
            document.getElementById('upload').click();
        }, 100);
    }
}

function saveAndClose() {
    canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));

    const dataURL = canvas.toDataURL({
        format: 'png'
    });

    // zobrazit v tabulce
    const cell = document.getElementById('fotoCell');
    cell.innerHTML = `<img src="${dataURL}" style="max-width:100%; height:auto;">`;

    // uložit do hidden inputu
    document.getElementById('obrazekData').value = dataURL;
    
    closeEditor();
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
}
//                                                                                                                                     === REAKCE NA NÁVRAT Z FILE DIALOGU ===
window.addEventListener('focus', function () {

    if (fileDialogOpened) {

        setTimeout(() => {
            const input = document.getElementById('upload');

            // ❌ uživatel nic nevybral
            if (!input.files.length) {
                alert("Nevybral jsi obrázek");

                closeEditor();
            }

            fileDialogOpened = false;

        }, 200);
    }
});

function toggleIcons() {
    const panel = document.getElementById('iconPanel');
    const brushpanel = document.getElementById('brushPanel');
    const colorPanel = document.getElementById('colorPanel');

    brushPanel.style.display = 'none';
    colorPanel.style.display = 'none';
    
    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
    
    setTimeout(resizeCanvas, 50);
}

function addIcon(src) {
    fabric.Image.fromURL(src, function(img) {
        img.set({
            left: 100,
            top: 100,
            scaleX: 0.3,
            scaleY: 0.3
        });

        canvas.add(img);
        canvas.setActiveObject(img);
    });
}

function resizeCanvas() {
    const toolbar = document.getElementById('toolbar');
    const icons = document.getElementById('iconPanel');
    const upload = document.getElementById('upload');
    const colorPanel = document.getElementById('colorPanel');
    const brushPanel = document.getElementById('brushPanel');

    const toolbarHeight = toolbar.offsetHeight;
    const iconsHeight = icons.offsetHeight;
    const uploadHeight = upload.offsetHeight;
    const colorHeight = colorPanel.offsetHeight;
    const brushHeight = brushPanel.offsetHeight;

    // 👉 TADY PATŘÍ TEN ŘÁDEK
    const height = window.innerHeight 
        - toolbarHeight 
        - iconsHeight 
        - uploadHeight 
        - colorHeight 
        - brushHeight;

    const width = window.innerWidth;

    // Fabric nastavení
    canvas.setWidth(width);
    canvas.setHeight(height);

    canvas.lowerCanvasEl.width = width;
    canvas.lowerCanvasEl.height = height;

    canvas.wrapperEl.style.width = width + 'px';
    canvas.wrapperEl.style.height = height + 'px';

    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    canvas.renderAll();
}

let undoStack = [];
let redoStack = [];
let isRestoring = false;
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function saveState() {
    if (isRestoring) return;
    
    const current = JSON.stringify(canvas);
    
    // zabrání duplicitám
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === current) {
        return;
    }
    
    undoStack.push(current);
    redoStack = [];
    
    if (undoStack.length > 30) {
        undoStack.shift();
    }
}

canvas.on('object:modified', function() {
    saveState();
});

canvas.on('path:created', function() {
    saveState();
});

//                                                                                                                                          === UPLOAD + VALIDACE + KOMPRESSE ===
document.getElementById('upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert("Pouze obrázky!");
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            
            const maxWidth = canvas.width;
            const maxHeight = canvas.height;
            
            const scale = Math.min(
                maxWidth / img.width,
                maxHeight / img.height
                );
                
                img.scale(scale);
                
                img.set({
                    left: (canvas.width - img.width * scale) / 2,
                    top: (canvas.height - img.height * scale) / 2,
                    selectable: false
                });
                canvas.clear();
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                saveState();
            });
        };
        
        reader.readAsDataURL(file);
    });
    
    // === KOMPRESSE ===
    function compressImage(dataUrl, callback) {
        const img = new Image();
        img.src = dataUrl;
        
        img.onload = function() {
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            const maxWidth = 1000;
            const scale = maxWidth / img.width;
            
            tempCanvas.width = maxWidth;
            tempCanvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            
        const compressed = tempCanvas.toDataURL('image/jpeg', 0.7);
        callback(compressed);
    };
}

//                                                                                                                              ========================= KRESLENÍ ===========================

canvas.freeDrawingBrush.color = "black";
canvas.freeDrawingBrush.width = 2;
function enableDraw() {
    canvas.isDrawingMode = true;
}
function toggleColors() {
    const panel = document.getElementById('colorPanel');
    const brushPanel = document.getElementById('brushPanel');
    const iconPanel = document.getElementById('iconPanel');

    brushPanel.style.display = 'none';
    iconPanel.style.display = 'none';

    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';

    setTimeout(resizeCanvas, 50);
}
function setColor(color) {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = color;

    document.getElementById('colorPanel').style.display = 'none';

    resizeCanvas();
}
function toggleBrushSize() {
    const panel = document.getElementById('brushPanel');
    const colorPanel = document.getElementById('colorPanel');
    const iconPanel = document.getElementById('iconPanel');

    colorPanel.style.display = 'none';
    iconPanel.style.display = 'none';
    
    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';

    setTimeout(resizeCanvas, 50);
}
function setBrushSize(size) {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = size;

    document.getElementById('brushPanel').style.display = 'none';

    resizeCanvas();
}

//                                                                                                                                ====================== TEXT =========================
function addText() {
    canvas.isDrawingMode = false;
    const text = new fabric.IText('Text', { left: 100, top: 100 });
    canvas.add(text);
    saveState();
}
function addArrow() {
    fabric.loadSVGFromURL('/static/icons/arrow.svg', function(objects, options) {

        const obj = fabric.util.groupSVGElements(objects, options);

        obj.set({
            left: 100,
            top: 100,
            scaleX: 0.7,
            scaleY: 0.7
        });

        canvas.add(obj);
        canvas.setActiveObject(obj);

        saveState();
    });
}
function addKotevniBod() {
    fabric.loadSVGFromURL('/static/icons/kotevniBod.svg', function(objects, options) {

        const obj = fabric.util.groupSVGElements(objects, options);

        obj.set({
            left: 100,
            top: 100,
            scaleX: 0.7,
            scaleY: 0.7
        });

        canvas.add(obj);
        canvas.setActiveObject(obj);

        saveState();
    });
}

//                                                                                                                                          === UNDO ===
function undo() {
    if (undoStack.length < 2) return;

    isRestoring = true;

    // aktuální stav přesuneme do redo
    const currentState = undoStack.pop();
    redoStack.push(currentState);

    // vezmeme PŘEDCHOZÍ stav
    const previousState = undoStack[undoStack.length - 1];

    canvas.loadFromJSON(previousState, function() {
        canvas.renderAll();
        isRestoring = false;
    });
}
//                                                                                                                                          === REDO ===
function redo() {
    if (redoStack.length === 0) return;

    isRestoring = true;

    const nextState = redoStack.pop();

    undoStack.push(nextState);

    canvas.loadFromJSON(nextState, function() {
        canvas.renderAll();
        isRestoring = false;
    });
}
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }

    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});


//                                                                                                                                          === ULOŽENÍ ===
function save() {
    const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.8
    });

    fetch('/uloz-obrazek/{{ formular.id }}/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': CSRF_TOKEN
        },
        body: JSON.stringify({ image: dataURL })
    })
    .then(res => res.json())
    .then(() => alert("Uloženo!"));
}


//                                                                                                                                  === Vymaž vše kromě obrázku na pozadí ===
function clearCanvas() {
    canvas.getObjects().forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    saveState();
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete') {
        const active = canvas.getActiveObject();
        if (active) {
            canvas.remove(active);
            saveState();
        }
    }

});


function cursorMode() {
    canvas.isDrawingMode = false;
}

async function exportForm() {
    const data = {
        zhotovitel: document.querySelector('[name="zhotovitel"]').value,
        zadavatel: document.querySelector('[name="zadavatel"]').value,
        kontakt: document.querySelector('[name="kontakt"]').value,
        telefonZadavatel: document.querySelector('[name="telefonZadavatel"]').value,
        jmenoPrijmeni: document.querySelector('[name="jmenoPrijmeni"]').value,
        telefonMajitel: document.querySelector('[name="telefonMajitel"]').value,
        datum: document.querySelector('[name="datum"]').value,
        pracovni_doba: document.querySelector('[name="pracovni_doba"]').value,
        misto_prace: document.querySelector('[name="misto_prace"]').value,
        souradnice: document.querySelector('[name="souradnice"]').value,
        max_vyska: document.querySelector('[name="max_vyska"]').value,
        zarizeni: document.querySelector('[name="zarizeni"]').value,
        strom: document.querySelector('[name="strom"]').value,
        pracovni_ukon: document.querySelector('[name="pracovni_ukon"]').value,
        specifika_pracoviste: document.querySelector('[name="specifika_pracoviste"]').value,
        postup_prace: document.querySelector('[name="postup_prace"]').value,
        obrazek_data: document.getElementById('obrazekData').value,
        vedouci_jmeno: document.querySelector('[name="vedouci_jmeno"]').value,
        vedouci_cinnost: document.querySelector('[name="vedouci_cinnost"]').value,
        vedouci_kvalifikace: document.querySelector('[name="vedouci_kvalifikace"]').value,
        pracovnici: getPracovniciData(),
        rizika: getRizikaData()
    };

    if (!window.showSaveFilePicker) {
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = "formular.json";
        a.click();
        return;
    }

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: "formular.json",
            types: [{
                description: "JSON soubory",
                accept: { "application/json": [".json"] }
            }]
        });

        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

    } catch (err) {
        console.log(err);
    }
}

function getPracovniciData() {
    const rows = document.querySelectorAll('#pracovniciTable tr');

    const data = [];

    rows.forEach(row => {
        const jmeno = row.querySelector('.jmeno').value;
        const cinnost = row.querySelector('.cinnost').value;
        const kvalifikace = row.querySelector('.kvalifikace').value;

        if (jmeno || cinnost || kvalifikace) {
            data.push({ jmeno, cinnost, kvalifikace });
        }
    });

    return data;
}

window.onload = function() {
    const dataURL = document.getElementById('obrazekData').value;

    if (dataURL) {
        document.getElementById('fotoCell').innerHTML =
            `<img src="${dataURL}" style="max-width:100%; height:auto;">`;
    }
};

function addRow(data = {}) {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td></td>
        <td><input type="text" class="jmeno" value="${data.jmeno || ''}"></td>
        <td><input type="text" class="cinnost" value="${data.cinnost || ''}"></td>
        <td><input type="text" class="kvalifikace" value="${data.kvalifikace || ''}"></td>
    `;

    tableBody.appendChild(row);
}

document.addEventListener("DOMContentLoaded", function () {

    tableBody = document.getElementById('pracovniciTable');

    // 👉 první řádek
    addRow();

    // 👉 přidávání dalších
    tableBody.addEventListener('input', function () {
        const rows = tableBody.querySelectorAll('tr');
        const lastRow = rows[rows.length - 1];

        const inputs = lastRow.querySelectorAll('input');
        const isFilled = Array.from(inputs).some(i => i.value.trim() !== '');

        if (isFilled) {
            addRow();
        }
    });

    tableBody.addEventListener('blur', function () {

    const rows = tableBody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');

        const isEmpty = Array.from(inputs).every(input => input.value.trim() === '');

        if (isEmpty && rows.length > 1 && index !== rows.length - 1) {
            row.remove();
        }
    });

    }, true);

    // 👉 načtení dat z Django
    const existingData = EXISTING_DATA;

    if (existingData && existingData.length) {
        tableBody.innerHTML = "";

        existingData.forEach(item => addRow(item));

        addRow();
    }

    const input = document.getElementById('souradniceInput');

    input.addEventListener('blur', function () {

        const value = input.value.trim();

        if (!value) return;

        const parts = value.split(',');

        if (parts.length !== 2) {
            alert("Použij formát: 50.123456, 15.123456");
            return;
        }

        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (isNaN(lat) || isNaN(lng)) {
            alert("Neplatné souřadnice!");
            return;
        }

        if (map) {
            if (marker) map.removeLayer(marker);

            marker = L.marker([lat, lng]).addTo(map);
            map.setView([lat, lng], 15);
        }
    });

    renderPodpisTable();

    document.querySelector('[name="vedouci_jmeno"]').addEventListener('input', renderPodpisTable);
    document.querySelector('[name="vedouci_cinnost"]').addEventListener('input', renderPodpisTable);
    document.querySelector('[name="vedouci_kvalifikace"]').addEventListener('input', renderPodpisTable);

    document.getElementById('pracovniciTable').addEventListener('input', renderPodpisTable);

});

document.querySelector('form').addEventListener('submit', function () {

    const rows = document.querySelectorAll('#pracovniciTable tr');

    const data = [];

    rows.forEach(row => {
        const jmeno = row.querySelector('.jmeno').value;
        const cinnost = row.querySelector('.cinnost').value;
        const kvalifikace = row.querySelector('.kvalifikace').value;

        if (jmeno || cinnost || kvalifikace) {
            data.push({ jmeno, cinnost, kvalifikace });
        }
    });

    document.getElementById('pracovniciData').value = JSON.stringify(getPracovniciData());
});

function addEmptyRow() {
    const tableBody = document.getElementById('pracovniciTable');

    const row = document.createElement('tr');

    row.innerHTML = `
        <td></td>
        <td><input type="text" class="jmeno"></td>
        <td><input type="text" class="cinnost"></td>
        <td><input type="text" class="kvalifikace"></td>
    `;

    tableBody.appendChild(row);
}

//                                                                                                                      ========== MAPA ========== 
let map = L.map('map').setView([50.0, 15.0], 13);
let marker;

let switched = false;
let tile1 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

let tile2 = L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

// první pokus
tile1.addTo(map);

tile1.on('tileerror', function () {

    if (switched) return; // 👈 ochrana

    switched = true;

    console.log("tile1 selhal → přepínám na tile2");

    map.removeLayer(tile1);
    tile2.addTo(map);
});

// když selže i tile2 → ruční režim
tile2.on('tileerror', function () {
    console.log("tile2 selhal → ruční zadání");

    manualCoords();
});

map.on('click', function(e) {

    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);

    document.getElementById('souradniceInput').value = lat + ", " + lng;
});

const input = document.getElementById('souradniceInput');

if (input.value) {
    const parts = input.value.split(',');

    if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        map.setView([lat, lng], 15);
        marker = L.marker([lat, lng]).addTo(map);
    }
}

function openMap() {

    if (!navigator.onLine) {
        
        alert("Mapa je offline")
        closeMap();
        return;
    }

    document.getElementById('mapModal').style.display = 'flex';

    setTimeout(() => {

        if (!map) {

            try {
                map = L.map('map').setView([50.0, 15.0], 13);

                let tile1 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
                let tile2 = L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');

                tile1.addTo(map);

                tile1.on('tileerror', function () {
                    map.removeLayer(tile1);
                    tile2.addTo(map);
                });

            } catch (e) {
                console.log("Mapa selhala");
                alert("Mapa selhala")
                closeMap();
                return;
            }

            map.on('click', function(e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);

                if (marker) map.removeLayer(marker);

                marker = L.marker([lat, lng]).addTo(map);

                document.getElementById('souradniceInput').value = lat + ", " + lng;
            });
        }

        map.invalidateSize();

    }, 200);
}

function closeMap() {
    document.getElementById('mapModal').style.display = 'none';
}

//                                                                                                                   ======================= PODPISY ========================

function renderPodpisTable() {

    const tbody = document.getElementById('podpisTable');
    if (!tbody) return;

    tbody.innerHTML = "";

    const vedouciJmeno = document.querySelector('[name="vedouci_jmeno"]')?.value || "";
    const vedouciCinnost = document.querySelector('[name="vedouci_cinnost"]')?.value || "";
    const vedouciKvalifikace = document.querySelector('[name="vedouci_kvalifikace"]')?.value || "";

    if (vedouciJmeno || vedouciCinnost || vedouciKvalifikace) {
        createPodpisRow({
            jmeno: vedouciJmeno,
            cinnost: vedouciCinnost,
            kvalifikace: vedouciKvalifikace
        });
    }

    const rows = document.querySelectorAll('#pracovniciTable tr');

    rows.forEach(row => {

        const jmeno = row.querySelector('.jmeno')?.value || "";
        const cinnost = row.querySelector('.cinnost')?.value || "";
        const kvalifikace = row.querySelector('.kvalifikace')?.value || "";

        if (!jmeno && !cinnost && !kvalifikace) return;

        createPodpisRow({ jmeno, cinnost, kvalifikace });
    });
}

function createPodpisRow(data) {

    const tbody = document.getElementById('podpisTable');

    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${data.jmeno}</td>
        <td>${data.cinnost}</td>
        <td>${data.kvalifikace}</td>
        <td class="datum"></td>
        <td class="podpis" style="cursor:pointer; text-align:center;">Klikni pro podpis</td>
    `;

    const podpisCell = row.querySelector('.podpis');

    podpisCell.onclick = function () {
        openSignatureModal(podpisCell, row);
    };

    tbody.appendChild(row);
}

let signatureCanvas = new fabric.Canvas('signatureCanvas', {
    isDrawingMode: true,
    backgroundColor: 'white' 
});
signatureCanvas.freeDrawingBrush.color = "black";
signatureCanvas.freeDrawingBrush.width = 2;

let activePodpisCell = null;
let activeRow = null;

function openSignatureModal(cell, row) {
    activePodpisCell = cell;
    activeRow = row;

    document.getElementById('signatureModal').style.display = 'flex';
}

function saveSignature() {

    const dataURL = signatureCanvas.toDataURL({
        format: 'png'
    });

    // vložení do buňky
    activePodpisCell.innerHTML = `<img src="${dataURL}" style="max-height:80px;">`;

    // datum
    const today = new Date().toLocaleDateString('cs-CZ');
    activeRow.querySelector('.datum').textContent = today;

    // vyčistit canvas
    signatureCanvas.clear();

    closeSignatureModal();
}

function clearSignature() {
    signatureCanvas.clear();
}

function closeSignatureModal() {
    document.getElementById('signatureModal').style.display = 'none';
}