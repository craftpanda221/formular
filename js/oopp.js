//                                                                                              ================= OOPP U ČLENŮ SKUPINY =================
//
// Každý člen (vedoucí i ostatní) má v sekci 4 buňku "OOPP". Klik na ni
// otevře modal s 9 piktogramy; kliknutím se piktogram přepne na "checked"
// verzi. "Uložit" vloží zaškrtnuté piktogramy zmenšené vedle sebe do buňky.
//
// Vybrané OOPP se u buňky drží v data-oopp jako JSON pole klíčů,
// např. ["helma","postroj"] — stejné pole se exportuje / importuje.

const OOPP_ITEMS = [
    { key: 'bota',      label: 'Bota' },
    { key: 'bryle',     label: 'Brýle' },
    { key: 'helma',     label: 'Helma' },
    { key: 'maska',     label: 'Maska' },
    { key: 'oblek',     label: 'Oblek' },
    { key: 'postroj',   label: 'Postroj' },
    { key: 'rukavice',  label: 'Rukavice' },
    { key: 'sluchatka', label: 'Sluchátka' },
    { key: 'vesta',     label: 'Vesta' }
];

// 👉 JEDINÉ MÍSTO, kde se skládá název souboru ikony.
//    Neoznačené: "icons/oopp helma.svg"
//    Checked:    "icons/oopp helma checked.svg"
//    Pokud se tvoje checked soubory jmenují jinak, uprav jen tenhle řádek.
function ooppSrc(key, checked) {
    return 'icons/' + encodeURIComponent('oopp' + key + (checked ? 'checked' : '') + '.svg');
}

function ooppLabel(key) {
    const item = OOPP_ITEMS.find(i => i.key === key);
    return item ? item.label : key;
}

// ---------- data v buňce ----------

function getOoppOf(cell) {
    if (!cell || !cell.dataset.oopp) return [];
    try {
        const arr = JSON.parse(cell.dataset.oopp);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

// uloží výběr (jen známé klíče, bez duplicit, ve stálém pořadí) a překreslí buňku
function setOoppOn(cell, keys) {
    if (!cell) return;

    const wanted = Array.isArray(keys) ? keys : [];
    const clean = OOPP_ITEMS
        .map(i => i.key)
        .filter(k => wanted.includes(k));

    cell.dataset.oopp = JSON.stringify(clean);
    renderOoppCell(cell);
}

// zmenšené ikony vedle sebe (používá buňka člena i tabulka podpisů);
// bez vybraných OOPP vrací null
function createOoppIcons(keys) {

    if (!Array.isArray(keys) || keys.length === 0) return null;

    const wrap = document.createElement('div');
    wrap.classList.add('ooppIcons');

    keys.forEach(key => {
        const img = document.createElement('img');
        img.src = ooppSrc(key, false);   // v tabulce běžné ikony, "checked" jen v modalu
        img.alt = ooppLabel(key);
        img.title = ooppLabel(key);

        wrap.appendChild(img);
    });

    return wrap;
}

function renderOoppCell(cell) {

    const icons = createOoppIcons(getOoppOf(cell));
    cell.innerHTML = '';

    if (!icons) {
        const placeholder = document.createElement('span');
        placeholder.classList.add('ooppPlaceholder');
        placeholder.textContent = 'Vybrat';
        cell.appendChild(placeholder);
        return;
    }

    cell.appendChild(icons);
}

// ---------- buňka s klikem ----------

function initOoppCell(cell) {

    cell.classList.add('ooppCell');
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', 'Vybrat OOPP');

    cell.addEventListener('click', function () {
        openOopp(cell);
    });

    cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openOopp(cell);
        }
    });

    renderOoppCell(cell);
}

// vytvoří <td> pro nový řádek člena (volá addRow v core.js)
function createOoppCell(keys) {
    const td = document.createElement('td');
    initOoppCell(td);
    setOoppOn(td, keys);
    return td;
}

// ---------- modal ----------

let activeOoppCell = null;

function openOopp(cell) {

    activeOoppCell = cell;

    const selected = getOoppOf(cell);
    const grid = document.getElementById('ooppGrid');
    grid.innerHTML = '';

    OOPP_ITEMS.forEach(item => {

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('ooppItem');
        btn.dataset.key = item.key;
        btn.title = item.label;

        const img = document.createElement('img');
        img.alt = item.label;

        function setState(checked) {
            btn.classList.toggle('is-checked', checked);
            btn.setAttribute('aria-pressed', checked ? 'true' : 'false');
            btn.classList.remove('checked-fallback');
            img.onerror = function () {
                // checked soubor chybí → vrátit běžný obrázek a stav
                // ukázat aspoň rámečkem
                this.onerror = null;
                this.src = ooppSrc(item.key, false);
                btn.classList.add('checked-fallback');
            };
            img.src = ooppSrc(item.key, checked);
        }

        setState(selected.includes(item.key));

        btn.addEventListener('click', function () {
            setState(!btn.classList.contains('is-checked'));
        });

        btn.appendChild(img);
        grid.appendChild(btn);

        // předem načíst checked verzi, ať nebliká při prvním kliknutí
        new Image().src = ooppSrc(item.key, true);
    });

    document.getElementById('ooppModal').style.display = 'flex';
}

function closeOopp() {
    document.getElementById('ooppModal').style.display = 'none';
    activeOoppCell = null;
}

function saveOopp() {

    if (!activeOoppCell) return;

    const keys = Array.from(document.querySelectorAll('#ooppGrid .ooppItem.is-checked'))
        .map(btn => btn.dataset.key);

    const cell = activeOoppCell;
    setOoppOn(cell, keys);
    closeOopp();

    // vybrané OOPP se propisují i do tabulky podpisů na konci formuláře
    if (typeof renderPodpisTable === 'function') {
        renderPodpisTable();
    }

    // řádek člena se tím mohl stát "vyplněným" → ať se případně přidá další prázdný
    const row = cell.closest('#pracovniciTable tr');
    if (row) {
        row.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// zavření bez uložení: klik na tmavé pozadí nebo Esc
document.getElementById('ooppModal').addEventListener('click', function (e) {
    if (e.target === this) closeOopp();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('ooppModal').style.display === 'flex') {
        closeOopp();
    }
});

// pevné buňky (vedoucí pracovník, pracovník pověřený koordinací) jsou přímo v HTML
document.addEventListener('DOMContentLoaded', function () {
    ['vedouciOopp', 'koordinatorOopp'].forEach(id => {
        const cell = document.getElementById(id);
        if (cell) initOoppCell(cell);
    });
});