//                                                                                              ======================= MAPA =======================
//
// Závisí na Leafletu (~150 kB) a navíc při každém zobrazení stahuje
// dlaždice mapy ze sítě. Dřív se mapa (a tím i stahování dlaždic)
// vytvářela hned při načtení stránky, i když ji uživatel nikdy
// neotevřel. Teď se vše inicializuje líně — až při prvním kliknutí
// na ikonu mapy (openMap).

let map = null;
let marker;

function initMap() {
    if (map) return; // už inicializováno, nedělat znovu

    try {
        map = L.map('map').setView([50.0, 15.0], 13);

        let switched = false;

        let tile1 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap přispěvatelé'
        });

        let tile2 = L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap přispěvatelé'
        });

        tile1.addTo(map);

        tile1.on('tileerror', function () {
            if (switched) return;
            switched = true;
            map.removeLayer(tile1);
            tile2.addTo(map);
        });

        tile2.on('tileerror', function () {
            manualCoords();
        });

    } catch (e) {
        console.error("Mapa selhala", e);
        alert("Mapu se nepodařilo načíst.");
        closeMap();
        return;
    }

    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (marker) map.removeLayer(marker);

        marker = L.marker([lat, lng]).addTo(map);

        document.getElementById('souradniceInput').value = lat + ", " + lng;

        // nastavení .value sem neposílá 'input' událost, takže bod 6
        // traumatologického plánu by se jinak nedosynchronizoval
        if (typeof updateTraumaLokalizace === 'function') {
            updateTraumaLokalizace();
        }
    });

    // 👉 pokud už pole souřadnic má hodnotu (např. z importu), ukázat ji na mapě
    const input = document.getElementById('souradniceInput');
    if (input.value) {
        const parts = input.value.split(',').map(s => parseFloat(s.trim()));

        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            map.setView([parts[0], parts[1]], 15);
            marker = L.marker([parts[0], parts[1]]).addTo(map);
        }
    }
}

// 👉 fallback, když selžou obě dlaždicové služby – necháme uživatele zadat
// souřadnice ručně místo toho, aby appka jen potichu nereagovala
function manualCoords() {
    alert("Mapové podklady se nepodařilo načíst. Zadej prosím souřadnice ručně do pole 'Souřadnice'.");
    closeMap();
    const input = document.getElementById('souradniceInput');
    if (input) input.focus();
}

async function openMap() {

    if (!navigator.onLine) {
        alert("Mapa je offline");
        return;
    }

    document.getElementById('mapModal').style.display = 'flex';

    try {
        await ensureLeafletLoaded();
    } catch (err) {
        alert("Mapu se nepodařilo načíst — zkontroluj připojení k internetu.");
        console.error(err);
        closeMap();
        return;
    }

    initMap();

    if (!map) return; // initMap mohla selhat a zavřít modal

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function closeMap() {
    document.getElementById('mapModal').style.display = 'none';
}