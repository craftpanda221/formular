// //                                                                                              ================ RIZIKA A OPATŘENÍ ================
// //
// // Sekce "Jednoduché posouzení rizik" – je vždy viditelná součást
// // formuláře a nemá žádné externí závislosti, takže se načítá hned.

// //                                                                                                                                  ============== RIZIKA ==============

// // jeden řádek v nabídce rizik (checkbox + text) — skládá se přes DOM,
// // ne přes innerHTML, ať text s uvozovkami / HTML nic nerozbije
// function createRizikoRow(value, label, checked) {

//     const item = document.createElement('div');

//     const row = document.createElement('label');
//     row.classList.add('riziko-item');

//     const span = document.createElement('span');
//     span.textContent = label;

//     const cb = document.createElement('input');
//     cb.type = 'checkbox';
//     cb.classList.add('checkbox');
//     cb.value = value;
//     cb.checked = checked;

//     row.appendChild(span);
//     row.appendChild(cb);
//     item.appendChild(row);

//     return item;
// }

// function openRizika() {

//     const modal = document.getElementById('rizikaModal');
//     const list = document.getElementById('rizikaList');

//     list.innerHTML = "";

//     // 1) statická rizika z databáze
//     for (const key in rizikaData) {
//         list.appendChild(
//             createRizikoRow(key, rizikaData[key].label, selectedRizika.includes(key))
//         );
//     }

//     // 2) vlastní rizika přidaná dřív (nebo načtená z importu) —
//     //    vypadají a chovají se stejně jako statická
//     customRisks.forEach(text => {
//         list.appendChild(
//             createRizikoRow(text, text, selectedRizika.includes(text))
//         );
//     });

//     // 3) input + tlačítko úplně dole
//     const wrapper = document.createElement('div');
//     wrapper.id = 'customRiskContainer';
//     wrapper.style.gridColumn = '1 / -1';

//     const title = document.createElement('h3');
//     title.classList.add('opatreniTitle');
//     title.textContent = 'Vlastní riziko';

//     const input = document.createElement('input');
//     input.type = 'text';
//     input.id = 'customRiskInput';
//     input.placeholder = 'Zadejte vlastní riziko';

//     const addBtn = document.createElement('button');
//     addBtn.type = 'button';
//     addBtn.textContent = 'Přidat riziko';
//     addBtn.classList = 'buttonRizika';
//     addBtn.id = 'pridatBtn';

//     function addCustomRisk() {

//         const text = input.value.trim();
//         if (text === '') return;

//         const jeStaticke = Object.values(rizikaData).some(r => r.label === text);
//         if (jeStaticke || customRisks.includes(text)) {
//             input.value = '';
//             return;
//         }

//         customRisks.push(text);

//         // vložit nový řádek nad input, rovnou zaškrtnutý; nepřekreslujeme
//         // celý modal, ať se neztratí ostatní ještě neuložená zaškrtnutí
//         wrapper.before(createRizikoRow(text, text, true));

//         input.value = '';
//         input.focus();
//     }

//     addBtn.addEventListener('click', addCustomRisk);
//     input.addEventListener('keydown', function (e) {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             addCustomRisk();
//         }
//     });

//     wrapper.appendChild(title);
//     wrapper.appendChild(input);
//     wrapper.appendChild(addBtn);
//     list.appendChild(wrapper);

//     modal.style.display = "flex";
// }

// function closeRizika() {
//     document.getElementById('rizikaModal').style.display = "none";
// }

// function saveRizika() {

//     const checkboxes = document.querySelectorAll('#rizikaList input[type="checkbox"]');

//     selectedRizika = Array.from(checkboxes)
//         .filter(cb => cb.checked)
//         .map(cb => cb.value);

//     renderRizikaTable();

//     closeRizika();
// }

// // Po importu: vlastní rizika a opatření se vrátí i do nabídek v modalech
// // (ne jen do tabulky). Bere se jak ze zvláštních klíčů vlastni_rizika /
// // vlastni_opatreni, tak — pro starší exporty — z toho, co se v tabulce
// // nedá najít v databázi rizikaData.
// function restoreCustomFromImport(data) {

//     customRisks = [];
//     customOpatreni = {};

//     const addRisk = text => {
//         if (typeof text === 'string' && text.trim() !== '' &&
//             !rizikaData[text] && !customRisks.includes(text)) {
//             customRisks.push(text);
//         }
//     };

//     const addMeasure = (riziko, text) => {
//         if (typeof text !== 'string' || text.trim() === '') return;
//         const jeStaticke = rizikaData[riziko] && rizikaData[riziko].opatreni.includes(text);
//         if (jeStaticke) return;
//         if (!customOpatreni[riziko]) customOpatreni[riziko] = [];
//         if (!customOpatreni[riziko].includes(text)) customOpatreni[riziko].push(text);
//     };

//     if (Array.isArray(data.vlastni_rizika)) {
//         data.vlastni_rizika.forEach(addRisk);
//     }

//     if (data.vlastni_opatreni && typeof data.vlastni_opatreni === 'object') {
//         for (const riziko in data.vlastni_opatreni) {
//             if (Array.isArray(data.vlastni_opatreni[riziko])) {
//                 data.vlastni_opatreni[riziko].forEach(t => addMeasure(riziko, t));
//             }
//         }
//     }

//     // zpětná kompatibilita se starými exporty
//     (data.rizika || []).forEach(item => {
//         addRisk(item.riziko);
//         (item.opatreni || []).forEach(t => addMeasure(item.riziko, t));
//     });
// }

// function renderRizikaTable() {

//     const tbody = document.getElementById('rizikaTable');
//     tbody.innerHTML = "";

//     selectedRizika.forEach(riziko => {

//         const row = document.createElement('tr');

//         const td1 = document.createElement('td');
//         td1.textContent = rizikaData[riziko]
//             ? rizikaData[riziko].label
//             : riziko;
//         td1.colSpan = 2;

//         const td2 = document.createElement('td');
//         const opatreni = selectedOpatreni[riziko] || [];
//         opatreni.forEach((item, i) => {
//             if (i > 0) td2.appendChild(document.createElement('br'));
//             td2.appendChild(document.createTextNode("- " + item));
//         });
//         td2.colSpan = 2;
//         td2.style = "padding-left: 10px;"

//         row.appendChild(td1);
//         row.appendChild(td2);

//         tbody.appendChild(row);
//     });
// }

// function openOpatreni() {

//     const modal = document.getElementById('opatreniModal');
//     const list = document.getElementById('opatreniList');

//     list.innerHTML = "";

//     selectedRizika.forEach(riziko => {

//         const wrapper = document.createElement('div');
//         wrapper.classList.add('opatreni-wrapper');
        

//         const title = document.createElement('h3');
//         title.classList.add('opatreniTitle');
//         title.textContent = rizikaData[riziko]
//             ? rizikaData[riziko].label
//             : riziko;

//         wrapper.appendChild(title);

//         const selected = selectedOpatreni[riziko] || [];

//         // přednastavené možnosti + vlastní opatření už dřív přiřazená
//         // k tomuto riziku se vykreslují úplně stejně — obojí je teď jen
//         // "opatření", ani se podle sebe navzájem neví, jen jedna skupina
//         // má svůj text v databázi a druhá v customOpatreni.
//         const seznam = rizikaData[riziko]
//             ? rizikaData[riziko].opatreni
//             : [];

//         const vlastni = customOpatreni[riziko] || [];

//         [...seznam, ...vlastni].forEach(op=>{

//             const item = document.createElement('div');
//             item.classList.add('opatreni-item');

//             const label = document.createElement('label');
//             label.classList.add('riziko-item');

//             const span = document.createElement('span');
//             span.textContent = op;

//             const cb = document.createElement('input');
//             cb.type = 'checkbox';
//             cb.classList.add('checkbox');
//             cb.dataset.riziko = riziko;
//             cb.value = op;
//             cb.checked = selected.includes(op);

//             label.appendChild(span);
//             label.appendChild(cb);
//             item.appendChild(label);

//             wrapper.appendChild(item);
//         });

//         list.appendChild(wrapper);
//     });

//     renderCustomOpatreniSection();

//     modal.style.display = "flex";
// }

// //                                                                                                                                  ============== VLASTNÍ OPATŘENÍ ==============
// //
// // Na konci modalu je jeden input. Dokud je prázdný, nic se neděje.
// // Jakmile se do něj něco napíše, zobrazí se seznam vybraných rizik —
// // zaškrtnutím rizika se text přiřadí k němu jako další opatření
// // (se svým checkboxem, přímo v seznamu u daného rizika, natrvalo —
// // bez možnosti smazání) a input se zase vyprázdní.

// function renderCustomOpatreniSection() {

//     const list = document.getElementById('opatreniList');

//     const wrapper = document.createElement('div');
//     wrapper.classList.add('opatreni-wrapper');
//     wrapper.id = 'customOpatreniContainer';

//     const title = document.createElement('h3');
//     title.classList.add('opatreniTitle');
//     title.textContent = 'Vlastní opatření';
//     wrapper.appendChild(title);

//     const input = document.createElement('input');
//     input.type = 'text';
//     input.id = 'customOpatreniInput';
//     input.placeholder = 'Zadejte vlastní opatření...';

//     const rizikaChecklist = document.createElement('div');
//     rizikaChecklist.id = 'customOpatreniRizikaChecklist';
//     rizikaChecklist.style.display = 'none';

//     input.oninput = function () {
//         rizikaChecklist.style.display = this.value.trim() !== '' ? 'flex' : 'none';
//     };

//     wrapper.appendChild(input);
//     wrapper.appendChild(rizikaChecklist);

//     selectedRizika.forEach(riziko => {

//         const item = document.createElement('div');
//         item.classList.add('opatreni-item');

//         const lbl = document.createElement('label');
//         lbl.classList.add('riziko-item');

//         const lblText = document.createElement('span');
//         lblText.textContent = rizikaData[riziko] ? rizikaData[riziko].label : riziko;

//         const lblCb = document.createElement('input');
//         lblCb.type = 'checkbox';
//         lblCb.classList.add('checkbox');

//         lbl.appendChild(lblText);
//         lbl.appendChild(lblCb);
//         item.appendChild(lbl);

//         lblCb.addEventListener('change', function () {

//             const text = input.value.trim();

//             if (!this.checked || text === '') return;

//             if (!customOpatreni[riziko]) {
//                 customOpatreni[riziko] = [];
//             }

//             // stejný text u stejného rizika podruhé nepřidávat
//             if (!customOpatreni[riziko].includes(text)) {
//                 customOpatreni[riziko].push(text);
//             }

//             // rovnou i "zaškrtnuté" v samotném seznamu rizika, ať je
//             // vidět hned, ne až po kliknutí na hlavní "Uložit"
//             if (!selectedOpatreni[riziko]) {
//                 selectedOpatreni[riziko] = [];
//             }
//             if (!selectedOpatreni[riziko].includes(text)) {
//                 selectedOpatreni[riziko].push(text);
//             }

//             // překreslit celý modal, ať se nové opatření objeví
//             // rovnou u svého rizika nahoře, ne jen tady dole
//             openOpatreni();
//         });

//         rizikaChecklist.appendChild(item);
//     });

//     // při přerendrování nahradit starý container, ne ho duplikovat
//     const existing = document.getElementById('customOpatreniContainer');
//     if (existing) {
//         existing.replaceWith(wrapper);
//     } else {
//         list.appendChild(wrapper);
//     }
// }

// function closeOpatreni() {
//     document.getElementById('opatreniModal').style.display = "none";
// }

// function saveOpatreni() {

//     selectedOpatreni = {};

//     const checkboxes = document.querySelectorAll('#opatreniList input[data-riziko]');

//     checkboxes.forEach(cb => {

//         if (!cb.checked) return;

//         const riziko = cb.dataset.riziko;

//         if (!selectedOpatreni[riziko]) {
//             selectedOpatreni[riziko] = [];
//         }

//         selectedOpatreni[riziko].push(cb.value);
//     });

//     // Pozn.: vlastní opatření (customOpatreni) se tu zvlášť neřeší —
//     // vykreslují se jako běžné checkboxy přímo u svého rizika (viz
//     // openOpatreni), takže je výše uvedený průchod zachytí sám.

//     renderRizikaTable();

//     closeOpatreni();
// }


// function getRizikaData() {

//     return selectedRizika.map(riziko => ({
//         riziko: riziko,
//         opatreni: selectedOpatreni[riziko] || []
//     }));
// }

// const rizikaData = {
//     "pad_z_vysky": {
//         label: "Pád z výšky",
//         opatreni: [
//             "OOPP proti pádu",
//             "Periodická prohlídka OOPP",
//             "Kontrola OOPP před použitím",
//             "Vhodné počasí",
//             "Zhodnocení stromu před prací",
//             "Školení pro práci ve výškách",
//             "Plán práce",
//             "Analýza rizik",
//             "Dodržení návodu k použití",
//             "Dozor druhé osoby",
//             "Vhodně zvolený žebřík",
//             "Zajištění žebříku"
//         ]
//     },

//     "dest": {
//         label: "Déšť",
//         opatreni: [
//             "Sledování předpovědi",
//             "Krátkodobá práce",
//             "Výměna mokrého vybavení"
//         ]
//     },

//     "sklouznuti": {
//         label: "Sklouznutí",
//         opatreni: [
//             "Vhodná obuv",
//             "Očištěná obuv",
//             "Změna času práce"
//         ]
//     },

//     "snih": {
//         label: "Sníh",
//         opatreni: [
//             "Sledování předpovědi",
//             "Krátkodobá práce",
//             "Výměna mokrého vybavení",
//             "Vhodné rukavice",
//             "Častější přestávky"
//         ]
//     },

//     "zima": {
//         label: "Zima",
//         opatreni: [
//             "Sledování předpovědi",
//             "Krátkodobá práce",
//             "Teplé oblečení",
//             "Vhodné rukavice",
//             "Častější přestávky"
//         ]
//     },

//     "teplo": {
//         label: "Teplo",
//         opatreni: [
//             "Dostatek tekutin",
//             "Tekutiny ve stromě",
//             "Krátkodobá práce"
//         ]
//     },

//     "vitr": {
//         label: "Vítr",
//         opatreni: [
//             "Sledování předpovědi",
//             "Zvětšení pracovního prostoru",
//             "Přerušení práce nad 12 m/s"
//         ]
//     },

//     "stav_stromu": {
//         label: "Stav stromu",
//         opatreni: [
//             "Odborné hodnocení stromu",
//             "Vizuální kontrola stromolezcem"
//         ]
//     },

//     "hmyz": {
//         label: "Hmyz",
//         opatreni: [
//             "Změna času práce",
//             "Zapěnění otvoru",
//             "Antialergika",
//             "Kontrola alergie pracovníka"
//         ]
//     },

//     "elektrina": {
//         label: "Elektrické vedení",
//         opatreni: [
//             "Vypnutí energetiky",
//             "Zakrytí vedení",
//             "Použití laminátového teleskopu"
//         ]
//     },

//     "majetek": {
//         label: "Majetek pod stromem",
//         opatreni: [
//             "Odstranění majetku",
//             "Zakrytí majitelem",
//             "Zakrytí firmou",
//             "Spouštění materiálu lanem",
//             "Kontrolovaný shoz"
//         ]
//     },

//     "doprava": {
//         label: "Doprava",
//         opatreni: [
//             "Výstražné cedule",
//             "Kužely",
//             "Pozemní pracovníci",
//             "Řízení dopravy",
//             "Vysílačky",
//             "Práce mimo špičku",
//             "Externí firma"
//         ]
//     },

//     "chodci": {
//         label: "Pohyb osob",
//         opatreni: [
//             "Trvalý dozor",
//             "Vyznačení páskou",
//             "Zablokování prostoru",
//             "Informování obyvatel",
//             "Výstražné oblečení"
//         ]
//     },

//     "rezani": {
//         label: "Řezání",
//         opatreni: [
//             "Použití OOPP",
//             "Vhodný výběr pily",
//             "Školení"
//         ]
//     },

//     "poskozeni_vybaveni": {
//         label: "Poškození vybavení",
//         opatreni: [
//             "Záložní vybavení"
//         ]
//     },

//     "ptaci_hnizdo": {
//         label: "Ptačí hnízdo",
//         opatreni: [
//             "Změna termínu",
//             "Komunikace s ornitologem"
//         ]
//     },

//     "pad_materialu": {
//         label: "Pád materiálu",
//         opatreni: [
//             "Zajištění materiálu",
//             "Vyloučení pohybu pod stromem",
//             "Helmy",
//             "Domluvený prostor dopadu"
//         ]
//     },

//     "signal": {
//         label: "Bez signálu",
//         opatreni: [
//             "Telefon s jiným operátorem",
//             "Záchranný plán"
//         ]
//     },

//     "teren": {
//         label: "Nestabilní terén",
//         opatreni: [
//             "Komunikace s majitelem",
//             "Vyznačení nebezpečného místa"
//         ]
//     },

//     "popaleniny": {
//         label: "Popáleniny",
//         opatreni: [
//             "Vhodné oblečení",
//             "Rukavice"
//         ]
//     },

//     "zrak": {
//         label: "Poškození zraku",
//         opatreni: [
//             "Štít",
//             "Brýle"
//         ]
//     },

//     "stepkovac": {
//         label: "Štěpkovač",
//         opatreni: [
//             "Seznámení s návodem",
//             "Proškolení",
//             "Použití OOPP"
//         ]
//     },

//     "plosina": {
//         label: "Plošina",
//         opatreni: [
//             "Výběr vhodné plošiny",
//             "Proškolení obsluhy",
//             "Revize zařízení",
//             "Kontrola před použitím"
//         ]
//     }
// };


//                                                                                              ================ RIZIKA A OPATŘENÍ ================
//
// Sekce "Jednoduché posouzení rizik" – je vždy viditelná součást
// formuláře a nemá žádné externí závislosti, takže se načítá hned.

//                                                                                                                                  ============== RIZIKA ==============

// jeden řádek v nabídce rizik (checkbox + text) — skládá se přes DOM,
// ne přes innerHTML, ať text s uvozovkami / HTML nic nerozbije
function createRizikoRow(value, label, checked) {

    const item = document.createElement('div');

    const row = document.createElement('label');
    row.classList.add('riziko-item');

    const span = document.createElement('span');
    span.textContent = label;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.classList.add('checkbox');
    cb.value = value;
    cb.checked = checked;

    row.appendChild(span);
    row.appendChild(cb);
    item.appendChild(row);

    return item;
}

function openRizika() {

    const modal = document.getElementById('rizikaModal');
    const list = document.getElementById('rizikaList');

    list.innerHTML = "";

    // 1) statická rizika z databáze
    for (const key in rizikaData) {
        list.appendChild(
            createRizikoRow(key, rizikaData[key].label, selectedRizika.includes(key))
        );
    }

    // 2) vlastní rizika přidaná dřív (nebo načtená z importu) —
    //    vypadají a chovají se stejně jako statická
    customRisks.forEach(text => {
        list.appendChild(
            createRizikoRow(text, text, selectedRizika.includes(text))
        );
    });

    // 3) input + tlačítko úplně dole
    const wrapper = document.createElement('div');
    wrapper.id = 'customRiskContainer';
    wrapper.style.gridColumn = '1 / -1';

    const title = document.createElement('h3');
    title.classList.add('opatreniTitle');
    title.textContent = 'Vlastní riziko';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customRiskInput';
    input.placeholder = 'Zadejte vlastní riziko';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Přidat riziko';
    addBtn.classList = 'buttonRizika';
    addBtn.id = 'pridatBtn';

    function addCustomRisk() {

        const text = input.value.trim();
        if (text === '') return;

        const jeStaticke = Object.values(rizikaData).some(r => r.label === text);
        if (jeStaticke || customRisks.includes(text)) {
            input.value = '';
            return;
        }

        customRisks.push(text);

        // vložit nový řádek nad input, rovnou zaškrtnutý; nepřekreslujeme
        // celý modal, ať se neztratí ostatní ještě neuložená zaškrtnutí
        wrapper.before(createRizikoRow(text, text, true));

        input.value = '';
        input.focus();
    }

    addBtn.addEventListener('click', addCustomRisk);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomRisk();
        }
    });

    wrapper.appendChild(title);
    wrapper.appendChild(input);
    wrapper.appendChild(addBtn);
    list.appendChild(wrapper);

    modal.style.display = "flex";
}

function closeRizika() {
    document.getElementById('rizikaModal').style.display = "none";
}

function saveRizika() {

    const checkboxes = document.querySelectorAll('#rizikaList input[type="checkbox"]');

    selectedRizika = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    renderRizikaTable();

    closeRizika();
}

// Po importu: vlastní rizika a opatření se vrátí i do nabídek v modalech
// (ne jen do tabulky). Bere se jak ze zvláštních klíčů vlastni_rizika /
// vlastni_opatreni, tak — pro starší exporty — z toho, co se v tabulce
// nedá najít v databázi rizikaData.
function restoreCustomFromImport(data) {

    customRisks = [];
    customOpatreni = {};

    const addRisk = text => {
        if (typeof text === 'string' && text.trim() !== '' &&
            !rizikaData[text] && !customRisks.includes(text)) {
            customRisks.push(text);
        }
    };

    const addMeasure = (riziko, text) => {
        if (typeof text !== 'string' || text.trim() === '') return;
        const jeStaticke = rizikaData[riziko] && rizikaData[riziko].opatreni.includes(text);
        if (jeStaticke) return;
        if (!customOpatreni[riziko]) customOpatreni[riziko] = [];
        if (!customOpatreni[riziko].includes(text)) customOpatreni[riziko].push(text);
    };

    if (Array.isArray(data.vlastni_rizika)) {
        data.vlastni_rizika.forEach(addRisk);
    }

    if (data.vlastni_opatreni && typeof data.vlastni_opatreni === 'object') {
        for (const riziko in data.vlastni_opatreni) {
            if (Array.isArray(data.vlastni_opatreni[riziko])) {
                data.vlastni_opatreni[riziko].forEach(t => addMeasure(riziko, t));
            }
        }
    }

    // zpětná kompatibilita se starými exporty
    (data.rizika || []).forEach(item => {
        addRisk(item.riziko);
        (item.opatreni || []).forEach(t => addMeasure(item.riziko, t));
    });
}

function renderRizikaTable() {

    const tbody = document.getElementById('rizikaTable');
    tbody.innerHTML = "";

    selectedRizika.forEach(riziko => {

        const row = document.createElement('tr');

        const td1 = document.createElement('td');
        td1.textContent = rizikaData[riziko]
            ? rizikaData[riziko].label
            : riziko;
        td1.colSpan = 2;

        const td2 = document.createElement('td');
        const opatreni = selectedOpatreni[riziko] || [];
        opatreni.forEach((item, i) => {
            if (i > 0) td2.appendChild(document.createElement('br'));
            td2.appendChild(document.createTextNode("- " + item));
        });
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
        wrapper.dataset.riziko = riziko;

        const title = document.createElement('h3');
        title.classList.add('opatreniTitle');
        title.textContent = rizikaData[riziko]
            ? rizikaData[riziko].label
            : riziko;

        wrapper.appendChild(title);

        const selected = selectedOpatreni[riziko] || [];

        // přednastavené možnosti + vlastní opatření už dřív přiřazená
        // k tomuto riziku se vykreslují úplně stejně — obojí je teď jen
        // "opatření", ani se podle sebe navzájem neví, jen jedna skupina
        // má svůj text v databázi a druhá v customOpatreni.
        const seznam = rizikaData[riziko]
            ? rizikaData[riziko].opatreni
            : [];

        const vlastni = customOpatreni[riziko] || [];

        [...seznam, ...vlastni].forEach(op=>{

            const item = document.createElement('div');
            item.classList.add('opatreni-item');

            const label = document.createElement('label');
            label.classList.add('riziko-item');

            const span = document.createElement('span');
            span.textContent = op;

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.classList.add('checkbox');
            cb.dataset.riziko = riziko;
            cb.value = op;
            cb.checked = selected.includes(op);

            label.appendChild(span);
            label.appendChild(cb);
            item.appendChild(label);

            wrapper.appendChild(item);
        });

        list.appendChild(wrapper);
    });

    renderCustomOpatreniSection();

    modal.style.display = "flex";
}

//                                                                                                                                  ============== VLASTNÍ OPATŘENÍ ==============
//
// Na konci modalu je jeden input. Dokud je prázdný, nic se neděje.
// Jakmile se do něj něco napíše, zobrazí se seznam vybraných rizik —
// zaškrtnutím rizika se text přiřadí k němu jako další opatření
// (se svým checkboxem, přímo v seznamu u daného rizika, natrvalo —
// bez možnosti smazání) a input se zase vyprázdní.

function renderCustomOpatreniSection() {

    const list = document.getElementById('opatreniList');

    const wrapper = document.createElement('div');
    wrapper.classList.add('opatreni-wrapper');
    wrapper.id = 'customOpatreniContainer';

    const title = document.createElement('h3');
    title.classList.add('opatreniTitle');
    title.textContent = 'Vlastní opatření';
    wrapper.appendChild(title);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customOpatreniInput';
    input.placeholder = 'Zadejte vlastní opatření...';

    const rizikaChecklist = document.createElement('div');
    rizikaChecklist.id = 'customOpatreniRizikaChecklist';
    rizikaChecklist.style.display = 'none';

    input.oninput = function () {
        const maText = this.value.trim() !== '';
        rizikaChecklist.style.display = maText ? 'flex' : 'none';

        // nabídka rizik se objeví úplně dole → odrolovat tam, ať ji uživatel
        // vidí a nekliká rovnou na "Uložit"
        if (maText) {
            list.scrollTop = list.scrollHeight;
        }
    };

    wrapper.appendChild(input);
    wrapper.appendChild(rizikaChecklist);

    selectedRizika.forEach(riziko => {

        const item = document.createElement('div');
        item.classList.add('opatreni-item');

        const lbl = document.createElement('label');
        lbl.classList.add('riziko-item');

        const lblText = document.createElement('span');
        lblText.textContent = rizikaData[riziko] ? rizikaData[riziko].label : riziko;

        const lblCb = document.createElement('input');
        lblCb.type = 'checkbox';
        lblCb.classList.add('checkbox');

        lbl.appendChild(lblText);
        lbl.appendChild(lblCb);
        item.appendChild(lbl);

        lblCb.addEventListener('change', function () {

            const text = input.value.trim();

            if (!this.checked || text === '') return;

            // blok daného rizika v seznamu nahoře
            const block = Array.from(list.querySelectorAll('.opatreni-wrapper[data-riziko]'))
                .find(w => w.dataset.riziko === riziko);

            let row = null;

            if (block) {
                // stejné opatření už u rizika je (přednastavené i vlastní) → jen zaškrtnout
                const existingCb = Array.from(block.querySelectorAll('input[type="checkbox"]'))
                    .find(cb => cb.value === text);

                if (existingCb) {
                    existingCb.checked = true;
                    row = existingCb.closest('.opatreni-item');
                } else {
                    if (!customOpatreni[riziko]) {
                        customOpatreni[riziko] = [];
                    }
                    customOpatreni[riziko].push(text);

                    // nový řádek se vloží rovnou do bloku rizika, zaškrtnutý.
                    // Modal se nepřekresluje, takže ostatní (ještě neuložená)
                    // zaškrtnutí zůstanou, jak jsou.
                    row = document.createElement('div');
                    row.classList.add('opatreni-item');

                    const label = document.createElement('label');
                    label.classList.add('riziko-item');

                    const span = document.createElement('span');
                    span.textContent = text;

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.classList.add('checkbox');
                    cb.dataset.riziko = riziko;
                    cb.value = text;
                    cb.checked = true;

                    label.appendChild(span);
                    label.appendChild(cb);
                    row.appendChild(label);
                    block.appendChild(row);
                }
            }

            // vyprázdnit input a schovat nabídku rizik (připraveno na další)
            renderCustomOpatreniSection();

            // ukázat, kam se opatření přiřadilo
            if (row) {
                row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });

        rizikaChecklist.appendChild(item);
    });

    // při přerendrování nahradit starý container, ne ho duplikovat
    const existing = document.getElementById('customOpatreniContainer');
    if (existing) {
        existing.replaceWith(wrapper);
    } else {
        list.appendChild(wrapper);
    }
}

function closeOpatreni() {
    document.getElementById('opatreniModal').style.display = "none";
}

function saveOpatreni() {

    selectedOpatreni = {};

    const checkboxes = document.querySelectorAll('#opatreniList input[data-riziko]');

    checkboxes.forEach(cb => {

        if (!cb.checked) return;

        const riziko = cb.dataset.riziko;

        if (!selectedOpatreni[riziko]) {
            selectedOpatreni[riziko] = [];
        }

        selectedOpatreni[riziko].push(cb.value);
    });

    // Pozn.: vlastní opatření (customOpatreni) se tu zvlášť neřeší —
    // vykreslují se jako běžné checkboxy přímo u svého rizika (viz
    // openOpatreni), takže je výše uvedený průchod zachytí sám.

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