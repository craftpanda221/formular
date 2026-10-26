//                                                                                              ============== EDITOR OBRÁZKU (CANVAS) ==============
//
// Závisí na Fabric.js (~280 kB). Knihovna i samotné plátno se vytvoří
// až při prvním otevření editoru (openEditor), ne hned při načtení
// stránky – šetří to čas prvního vykreslení formuláře i data uživatele.

let canvas = null;
let fileDialogOpened = false;

function initCanvas() {
    if (canvas) return; // už inicializováno, nedělat znovu

    canvas = new fabric.Canvas('canvas', { backgroundColor: 'white' });

    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 2;

    canvas.on('object:modified', function() {
        saveState();
    });

    canvas.on('path:created', function() {
        saveState();
    });
}

window.addEventListener('resize', function() {
    if (canvas && document.getElementById('editorModal').style.display === 'flex') {
        resizeCanvas();
    }
});

// === OTEVŘENÍ EDITORU ===
async function openEditor() {

    try {
        await ensureFabricLoaded();
    } catch (err) {
        alert("Editor obrázku se nepodařilo načíst — zkontroluj připojení k internetu (knihovna se stahuje z CDN).");
        console.error(err);
        return;
    }

    initCanvas();

    const modal = document.getElementById('editorModal');
    modal.style.display = 'flex';

    resizeCanvas();

    cursorMode();

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
    cell.innerHTML = "";
    const img = document.createElement('img');
    img.src = dataURL;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    cell.appendChild(img);

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

    activeOhraniceni();

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
    if (!canvas) return;

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

const drawIcon = document.querySelector('[onclick="enableDraw()"]');
const cursorIcon = document.querySelector('[onclick="cursorMode()"]');
const paletteIcon = document.querySelector('[onclick="toggleColors()"]');
const brushIcon = document.querySelector('[onclick="toggleBrushSize()"]');

function enableDraw() {
    canvas.isDrawingMode = true;
    drawIcon.classList.add('active');
    cursorIcon.classList.remove('active');
}
function cursorMode() {
    canvas.isDrawingMode = false;
    cursorIcon.classList.add('active');
    drawIcon.classList.remove('active');
}
function toggleColors() {
    const panel = document.getElementById('colorPanel');
    const brushPanel = document.getElementById('brushPanel');
    const iconPanel = document.getElementById('iconPanel');

    brushPanel.style.display = 'none';
    iconPanel.style.display = 'none';

    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';

    activeOhraniceni();

    setTimeout(resizeCanvas, 50);
}
function setColor(color) {
    canvas.freeDrawingBrush.color = color;

    document.getElementById('colorPanel').style.display = 'none';

    activeOhraniceni();
    resizeCanvas();
}
function toggleBrushSize() {
    const panel = document.getElementById('brushPanel');
    const colorPanel = document.getElementById('colorPanel');
    const iconPanel = document.getElementById('iconPanel');

    colorPanel.style.display = 'none';
    iconPanel.style.display = 'none';

    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';

    activeOhraniceni();

    setTimeout(resizeCanvas, 50);
}
function setBrushSize(size) {
    canvas.freeDrawingBrush.width = size;

    document.getElementById('brushPanel').style.display = 'none';

    activeOhraniceni();
    resizeCanvas();
}
function activeOhraniceni(){
    const brushPanel = document.getElementById('brushPanel');
    const colorPanel = document.getElementById('colorPanel');

    if (brushPanel.style.display == 'flex'){brushIcon.classList.add('active');}
    else{brushIcon.classList.remove('active');}
    if (colorPanel.style.display == 'flex'){paletteIcon.classList.add('active');}
    else{paletteIcon.classList.remove('active');}
}

//                                                                                                                                ====================== TEXT =========================
function addText() {
    canvas.isDrawingMode = false;
    const text = new fabric.IText('Text', { left: 100, top: 100 });
    canvas.add(text);
    saveState();
}
function addArrow() {
    fabric.loadSVGFromURL('icons/arrow.svg', function(objects, options) {

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
    fabric.loadSVGFromURL('icons/kotevniBod.svg', function(objects, options) {

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
    if (!canvas || undoStack.length < 2) return;

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
    if (!canvas || redoStack.length === 0) return;

    isRestoring = true;

    const nextState = redoStack.pop();

    undoStack.push(nextState);

    canvas.loadFromJSON(nextState, function() {
        canvas.renderAll();
        isRestoring = false;
    });
}
//hover efekt
document.querySelectorAll('.tool-click').forEach(icon => {
    icon.addEventListener('click', () => {

        icon.classList.add('clicked');

        setTimeout(() => {
            icon.classList.remove('clicked');
        }, 150);
    });
});
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

//                                                                                                                                  === Vymaž vše kromě obrázku na pozadí ===
function clearCanvas() {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => canvas.remove(obj));
    canvas.renderAll();
    saveState();
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' && canvas) {
        const active = canvas.getActiveObject();
        if (active) {
            canvas.remove(active);
            saveState();
        }
    }

});
