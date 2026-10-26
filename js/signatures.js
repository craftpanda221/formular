//                                                                                              ======================= PODPISY =======================
//
// Podpisový panel taky používá Fabric.js (sdílí ho s canvas-editor.js —
// ensureFabricLoaded() si knihovnu stáhne jen jednou, ať ji vyvolá
// kterákoli z těch dvou částí jako první). Samotné plátno pro podpis
// se vytvoří až při prvním kliknutí na "Podepsat".

let podpisData = {};

function renderPodpisTable() {

    const tbody = document.getElementById('podpisTable');
    if (!tbody) return;

    tbody.innerHTML = "";

    // 👉 vedoucí
    const vedouciInput = document.querySelector('[name="vedouci_jmeno"]');

    if (vedouciInput && vedouciInput.value.trim() !== "") {
        createPodpisRow({
            jmeno: vedouciInput.value.trim(),
            oopp: getOoppOf(document.getElementById('vedouciOopp'))
        });
    }

    // 👉 pracovník pověřený koordinací
    const koordinatorInput = document.querySelector('[name="koordinator_jmeno"]');

    if (koordinatorInput && koordinatorInput.value.trim() !== "") {
        createPodpisRow({
            jmeno: koordinatorInput.value.trim(),
            oopp: getOoppOf(document.getElementById('koordinatorOopp'))
        });
    }

    // 👉 ostatní pracovníci
    const rows = document.querySelectorAll('#pracovniciTable tr');

    rows.forEach(row => {

        const input = row.querySelector('.jmeno');

        if (!input) return;

        const jmeno = input.value.trim();

        if (jmeno !== "") {
            createPodpisRow({ jmeno, oopp: getOoppOf(row.querySelector('.ooppCell')) });
        }
    });
}
function createPodpisRow(data) {

    const tbody = document.getElementById('podpisTable');
    const row = document.createElement('tr');

    const saved = podpisData[data.jmeno] || {};

    const jmenoCell = document.createElement('td');
    jmenoCell.textContent = data.jmeno;

    // OOPP člena — jen se propisují z tabulky členů, tady se needitují
    const ooppCell = document.createElement('td');
    ooppCell.classList.add('podpisOopp');
    const icons = createOoppIcons(data.oopp);
    if (icons) ooppCell.appendChild(icons);

    const datumCell = document.createElement('td');
    datumCell.classList.add('datum');
    datumCell.textContent = saved.datum || "";

    const podpisCell = document.createElement('td');
    podpisCell.classList.add('podpis');
    podpisCell.style.cursor = 'pointer';
    podpisCell.style.textAlign = 'center';

    if (saved.podpis) {
        const img = document.createElement('img');
        img.src = saved.podpis;
        img.style.maxHeight = '80px';
        podpisCell.appendChild(img);
    } else {
        podpisCell.textContent = "Podepsat";
    }

    row.appendChild(jmenoCell);
    row.appendChild(ooppCell);
    row.appendChild(datumCell);
    row.appendChild(podpisCell);

    podpisCell.onclick = function () {
        openSignatureModal(podpisCell, row, data.jmeno);
    };

    tbody.appendChild(row);
}

let signatureCanvas = null;

function initSignatureCanvas() {
    if (signatureCanvas) return; // už inicializováno, nedělat znovu

    signatureCanvas = new fabric.Canvas('signatureCanvas', {
        isDrawingMode: true,
        backgroundColor: 'white'
    });
    signatureCanvas.freeDrawingBrush.color = "black";
    signatureCanvas.freeDrawingBrush.width = 2;
}

let activePodpisCell = null;
let activeRow = null;
let activeJmeno = null;

async function openSignatureModal(cell, row, jmeno) {

    try {
        await ensureFabricLoaded();
    } catch (err) {
        alert("Podpisový panel se nepodařilo načíst — zkontroluj připojení k internetu.");
        console.error(err);
        return;
    }

    initSignatureCanvas();

    activePodpisCell = cell;
    activeRow = row;
    activeJmeno = jmeno;

    document.getElementById('signatureModal').style.display = 'flex';
}

function saveSignature() {
    if (!signatureCanvas) return;

    const dataURL = signatureCanvas.toDataURL({
        format: 'png'
    });

    const today = new Date().toLocaleDateString('cs-CZ');

    // 👉 ULOŽ DO OBJEKTU
    podpisData[activeJmeno] = {
        podpis: dataURL,
        datum: today
    };

    // 👉 ZNOVU RENDERUJ (už se to načte ze storage)
    renderPodpisTable();

    signatureCanvas.clear();
    closeSignatureModal();
}

function clearSignature() {
    if (signatureCanvas) signatureCanvas.clear();
}

function closeSignatureModal() {
    document.getElementById('signatureModal').style.display = 'none';
}