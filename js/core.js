//                                                                                              ============= SDÍLENÉ NÁSTROJE / STAV =============
//
// core.js se načítá vždy jako první a obsahuje jen to, co formulář
// potřebuje mít k dispozici hned (data pracovníků, import/export,
// vykreslení formuláře) + malou pomocnou funkci na LÍNÉ (lazy) načtení
// těžkých externích knihoven (Fabric.js, Leaflet) až ve chvíli,
// kdy je uživatel opravdu použije (mapa / editor obrázku / podpis).

const _loadedScripts = {};

function loadScript(src) {
    if (_loadedScripts[src]) return _loadedScripts[src];

    _loadedScripts[src] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Nepodařilo se načíst ${src}`));
        document.head.appendChild(script);
    });

    return _loadedScripts[src];
}

function loadStyle(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

// Fabric.js potřebuje jak editor obrázku (canvas-editor.js), tak podpisy
// (signatures.js) – knihovna se ale stáhne a spustí jen jednou, podruhé
// se vrátí ta samá (cachovaná) Promise.
let _fabricPromise = null;
function ensureFabricLoaded() {
    if (!_fabricPromise) {
        _fabricPromise = loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.2.4/fabric.min.js');
    }
    return _fabricPromise;
}

// Leaflet (mapa) potřebuje jen map.js – načte se až při prvním otevření mapy.
let _leafletPromise = null;
function ensureLeafletLoaded() {
    if (!_leafletPromise) {
        loadStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        _leafletPromise = loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    }
    return _leafletPromise;
}

let tableBody;
let selectedRizika = [];
let selectedOpatreni = {}; 
let customRisks = [];
let customOpatreni = {};
//                                                                                                              ================= IMPORT ===================

document.getElementById('importFile').addEventListener('change', function(e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {

        let data;

        try {
            data = JSON.parse(event.target.result);
        } catch (err) {
            alert("Vybraný soubor není platný JSON formulář.");
            console.error(err);
            return;
        }

        fillForm(data);
    };

    reader.onerror = function() {
        alert("Soubor se nepodařilo přečíst.");
    };

    reader.readAsText(file);

    // reset, aby šlo znovu nahrát i stejný soubor po sobě
    e.target.value = "";
});

//                                                                                                              ========= TRAUMATOLOGICKÝ PLÁN =========
//
// Textové pole je volně přepisovatelné — uživatel si v něm může
// upravit cokoliv. Jediná výjimka je bod 6 (LOKALIZACE – KDE JSME),
// jehož text za dvojtečkou se automaticky dopisuje podle polí
// "Místo práce" a "Souřadnice" (updateTraumaLokalizace), zbytek textu
// se při tom nemění.

const TRAUMA_PLAN_DEFAULT = `1. STŮJ !!! KLID – NEPANIKAŘ !!!

2. TVOJE BEZPEČNOST !!!

3. OBHLÉDNI TO → BEZPEČNOST – ZAJISTI ( tvoje, zraněného, ostatních )

4. RIZIKA ( co nás může ohrozit ?! )

5. CO SE STALO? Kolik je zraněných ?, zachránců ?

6. LOKALIZACE – KDE JSME:

7. POTŘEBUJEŠ ZÁCHRANKU Volej 155, 112, 150, Aplikace Záchranka

8. POSKYTNI PRVNÍ POMOC → Lékárnička → Evakuační sada
Dostat se bezpečně k zraněnému → Dostat zraněného bezpečně na zem
- Zastav život ohrožující krvácení – tlak přímo v ráně, tlakový obvaz, škrtidlo
- Zkontroluj stav vědomí
- → Komunikuje? Jste v pořádku?
- → Nekomunikuje → Přetoč zraněného na záda, sundej helmu, zakloň hlavu
→ Zjisti zda dýchá → přilož ucho k ústům a napočítej do deseti ( poslech, pohmat, pohled )
→ DÝCHÁ → Přetoč na bok do zotavovací polohy, stále sleduj dýchání, tepelný komfort zespodu a zvrchu
→ NEDÝCHÁ → Zahaj Resuscitaci ( stlačení hrudníku 100-120/min )

9. Čekání na příjezd IZS - BEZPEĆNOST – Tepelný komfort – Stále sledovat zraněného`;

function updateTraumaLokalizace() {

    
    const misto = document.querySelector('[name="misto_prace"]').value.trim();
    const souradnice = document.querySelector('[name="souradnice"]').value.trim();
    
    const doplnek = [misto, souradnice].filter(Boolean).join(', ');
    
    const kdeJsme = document.getElementById('traumaKdeJsme');
    if (kdeJsme) kdeJsme.textContent = doplnek;

    const textarea = document.getElementById('id_traumatologicky_plan');
    if (!textarea) return;
    // najde řádek "6. LOKALIZACE – KDE JSME:" a přepíše jen to, co je
    // za dvojtečkou — zbytek textu (i kdyby ho uživatel jinak upravil)
    // zůstává beze změny
    textarea.value = textarea.value.replace(
        /^(6\.\s*LOKALIZACE[^\n:]*:)(.*)$/m,
        (match, prefix) => prefix + (doplnek ? ' ' + doplnek : '')
    );
}

function fillForm(data) {

    //  AUTOMATICKÉ vyplnění všech inputů
    for (const key in data) {

        const input = document.querySelector(`[name="${key}"]`);

        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key] === true;
            } else {
                input.value = data[key];
            }
        }
    }

    // ===== SPECIÁLNÍ VĚCI =====

    // 🖼 obrázek
    if (data.obrazek_data && /^data:image\/(png|jpe?g);base64,/.test(data.obrazek_data)) {

        const fotoCell = document.getElementById('fotoCell');
        fotoCell.innerHTML = "";

        const img = document.createElement('img');
        img.src = data.obrazek_data;
        img.style.maxWidth = "100%";
        fotoCell.appendChild(img);

        document.getElementById('obrazekData').value = data.obrazek_data;
    }

    // OOPP vedoucího pracovníka
    setOoppOn(
        document.getElementById('vedouciOopp'),
        Array.isArray(data.vedouci_oopp) ? data.vedouci_oopp : []
    );

    // OOPP pracovníka pověřeného koordinací (textová pole se načtou obecnou smyčkou výše)
    setOoppOn(
        document.getElementById('koordinatorOopp'),
        Array.isArray(data.koordinator_oopp) ? data.koordinator_oopp : []
    );

    // pracovníci
    if (data.pracovnici) {

        const tableBody = document.getElementById('pracovniciTable');
        tableBody.innerHTML = "";

        //  použij EXISTUJÍCÍ funkci
        data.pracovnici.forEach(item => addRow(item));

        //  KLÍČOVÝ ŘÁDEK (prázdný na konec)
        addRow();
    }
    
    // ===== RIZIKA + OPATŘENÍ =====
    if (data.rizika) {

        selectedRizika = [];
        selectedOpatreni = {};

        // vlastní rizika/opatření zpět i do nabídek v modalech
        restoreCustomFromImport(data);

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

    // jména (vedoucí, koordinátor, pracovníci) se právě změnila → tabulka podpisů
    renderPodpisTable();

    // traumatologický_plan se naplnil obecnou smyčkou výše (má name=),
    // ale import nevyvolá 'input' událost, tak bod 6 dosynchronizujeme ručně
    updateTraumaLokalizace();
} 
//                                                                                                                                  ======== EXPORT ========      

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
        komunikace_slovne: document.querySelector('[name="komunikace_slovne"]').checked,
        komunikace_telefon: document.querySelector('[name="komunikace_telefon"]').checked,
        komunikace_komunikator: document.querySelector('[name="komunikace_komunikator"]').checked,
        komunikace_vysilacka: document.querySelector('[name="komunikace_vysilacka"]').checked,
        komunikace_jine_signaly: document.querySelector('[name="komunikace_jine_signaly"]').checked,
        postup_prace: document.querySelector('[name="postup_prace"]').value,
        obrazek_data: document.getElementById('obrazekData').value,
        vedouci_jmeno: document.querySelector('[name="vedouci_jmeno"]').value,
        vedouci_cinnost: document.querySelector('[name="vedouci_cinnost"]').value,
        vedouci_kvalifikace: document.querySelector('[name="vedouci_kvalifikace"]').value,
        vedouci_oopp: getOoppOf(document.getElementById('vedouciOopp')),
        koordinator_jmeno: document.querySelector('[name="koordinator_jmeno"]').value,
        koordinator_cinnost: document.querySelector('[name="koordinator_cinnost"]').value,
        koordinator_kvalifikace: document.querySelector('[name="koordinator_kvalifikace"]').value,
        koordinator_oopp: getOoppOf(document.getElementById('koordinatorOopp')),
        traumatologicky_plan: document.querySelector('[name="traumatologicky_plan"]').value,
        vybaveni_telefon: document.querySelector('[name="vybaveni_telefon"]').checked,
        vybaveni_lekarnicka: document.querySelector('[name="vybaveni_lekarnicka"]').checked,
        vybaveni_druhy_lezec: document.querySelector('[name="vybaveni_druhy_lezec"]').checked,
        vybaveni_evakuacni_sada: document.querySelector('[name="vybaveni_evakuacni_sada"]').checked,
        pracovnici: getPracovniciData(),
        rizika: getRizikaData(),
        vlastni_rizika: customRisks,
        vlastni_opatreni: customOpatreni
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
        const oopp = getOoppOf(row.querySelector('.ooppCell'));

        if (jmeno || cinnost || kvalifikace || oopp.length) {
            data.push({ jmeno, cinnost, kvalifikace, oopp });
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

// řádek je "prázdný", když nemá žádný text ani vybrané OOPP
function rowIsEmpty(row) {
    const textEmpty = Array.from(row.querySelectorAll('input'))
        .every(input => input.value.trim() === '');

    const ooppCell = row.querySelector('.ooppCell');
    const bezOopp = !ooppCell || getOoppOf(ooppCell).length === 0;

    return textEmpty && bezOopp;
}

function addRow(data = {}) {
    const row = document.createElement('tr');

    row.appendChild(document.createElement('td'));

    ['jmeno', 'cinnost', 'kvalifikace'].forEach(cls => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = cls;
        input.value = data[cls] || '';   // přes .value, ne přes HTML — uvozovky nic nerozbijí
        td.appendChild(input);
        row.appendChild(td);
    });

    row.appendChild(createOoppCell(data.oopp));

    tableBody.appendChild(row);

    updateOstatniLabel();
}

// popisek "Ostatní pracovníci/osoby:" patří vždy do levé buňky úplně prvního
// řádku generovaných účastníků — přepočítává se po každém přidání i smazání
// řádku, takže zůstane na správném místě, i když se první řádek odstraní
function updateOstatniLabel() {
    const rows = document.querySelectorAll('#pracovniciTable tr');

    rows.forEach((row, index) => {
        const cell = row.firstElementChild;
        cell.textContent = index === 0 ? 'Ostatní pracovníci/osoby:' : '';
        cell.classList.toggle('popisek', index === 0);
    });
}

document.addEventListener("DOMContentLoaded", function () {

    tableBody = document.getElementById('pracovniciTable');

    // 👉 první řádek
    addRow();

    // 👉 přidávání dalších
    tableBody.addEventListener('input', function () {
        const rows = tableBody.querySelectorAll('tr');
        const lastRow = rows[rows.length - 1];

        if (!rowIsEmpty(lastRow)) {
            addRow();
        }
    });

    tableBody.addEventListener('blur', function () {

    const rows = tableBody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        if (rowIsEmpty(row) && rows.length > 1 && index !== rows.length - 1) {
            row.remove();
        }
    });

    updateOstatniLabel();

    }, true);

    // 👉 formulář se vždy otevírá prázdný; data se doplní jen přes Import
    const existingData = [];

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

    document.querySelector('[name="koordinator_jmeno"]').addEventListener('input', renderPodpisTable);

    document.getElementById('pracovniciTable').addEventListener('input', renderPodpisTable);

    // traumatologický plán — výchozí text + propsání místa práce/souřadnic do bodu 6
    const traumaTextarea = document.getElementById('id_traumatologicky_plan');
    if (traumaTextarea && !traumaTextarea.value.trim()) {
        traumaTextarea.value = TRAUMA_PLAN_DEFAULT;
    }

    document.querySelector('[name="misto_prace"]').addEventListener('input', updateTraumaLokalizace);
    document.querySelector('[name="souradnice"]').addEventListener('input', updateTraumaLokalizace);

    updateTraumaLokalizace();

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