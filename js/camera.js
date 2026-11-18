// ================ FOTOAPARÁT S GALERIÍ ================
// Okno s živým náhledem kamery: uprostřed spoušť, vlevo dole ikona galerie,
// vpravo přepnutí přední / zadní kamery. Hotová fotka se předá editoru
// obrázku přes pole #upload. Kamera funguje jen na HTTPS (nebo localhost).

let cameraStream = null;
let cameraFacing = 'environment';   // 'environment' = zadní, 'user' = přední
let cameraToken = 0;                // pozná, že se okno zavřelo dřív, než kamera naskočila

function setCameraMessage(text) {
    const box = document.getElementById('cameraMessage');
    box.textContent = text;
    box.hidden = !text;

    // když živý náhled nejde, nabídnout fotku přes systémový fotoaparát telefonu
    document.getElementById('cameraNativeBtn').hidden = !text;
}

function stopCamera() {
    cameraToken++;

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const video = document.getElementById('cameraVideo');
    if (video) video.srcObject = null;
}

async function startCamera() {

    stopCamera();
    const token = cameraToken;

    const video = document.getElementById('cameraVideo');
    const shutter = document.getElementById('cameraShutter');
    shutter.disabled = true;
    document.getElementById('cameraSwitch').style.visibility = 'hidden';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraMessage('Fotoaparát tady nejde spustit (potřebuje zabezpečené spojení HTTPS). Vyber fotku z galerie.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: cameraFacing },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        // okno mezitím někdo zavřel → kameru hned vypnout
        if (token !== cameraToken) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        cameraStream = stream;
        video.srcObject = stream;
        video.classList.toggle('mirror', cameraFacing === 'user');
        await video.play().catch(() => {});

        shutter.disabled = false;
        setCameraMessage('');

        // přepínač kamer jen když je z čeho vybírat
        const devices = await navigator.mediaDevices.enumerateDevices();
        const kamer = devices.filter(d => d.kind === 'videoinput').length;
        document.getElementById('cameraSwitch').style.visibility = kamer > 1 ? 'visible' : 'hidden';

    } catch (err) {
        console.error(err);

        if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
            setCameraMessage('Přístup k fotoaparátu není povolený. Povol ho v nastavení prohlížeče, nebo vyber fotku z galerie.');
        } else if (err && err.name === 'NotFoundError') {
            setCameraMessage('Fotoaparát nebyl nalezen. Vyber fotku z galerie.');
        } else {
            setCameraMessage('Fotoaparát se nepodařilo spustit. Vyber fotku z galerie.');
        }
    }
}

function openCamera() {
    document.getElementById('cameraModal').style.display = 'flex';
    setCameraMessage('');
    startCamera();
}

// keepEditor = true → fotka byla vybrána, editor zůstává otevřený
function closeCamera(keepEditor) {
    stopCamera();
    document.getElementById('cameraModal').style.display = 'none';

    // zavřeno bez fotky a editor je prázdný → zavřít i ten
    if (keepEditor !== true &&
        typeof canvas !== 'undefined' && canvas && !canvas.backgroundImage &&
        typeof closeEditor === 'function') {
        closeEditor();
    }
}

function switchCamera() {
    cameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera();
}

// předá fotku editoru: stejné pole #upload a stejná událost "change" jako dřív
function sendFileToEditor(file) {

    if (!file) return;

    try {
        const dt = new DataTransfer();
        dt.items.add(file);

        const upload = document.getElementById('upload');
        upload.files = dt.files;
        upload.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
        console.error(err);
        alert('Fotku se nepodařilo předat editoru.');
        return;
    }

    closeCamera(true);
}

function takePhoto() {

    const video = document.getElementById('cameraVideo');

    if (!video.videoWidth || !video.videoHeight) return;

    // větší strana max. 2000 px — ať export JSON nenabobtná
    const scale = Math.min(1, 2000 / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    tmp.getContext('2d').drawImage(video, 0, 0, w, h);

    tmp.toBlob(function (blob) {
        if (!blob) {
            alert('Fotku se nepodařilo pořídit.');
            return;
        }
        sendFileToEditor(new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
}

// záloha: systémový fotoaparát telefonu (pole s "capture", funguje i bez HTTPS)
function takePhotoNative() {
    document.getElementById('cameraNativeInput').click();
}

document.getElementById('cameraNativeInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    e.target.value = '';
    sendFileToEditor(file);
});

// ikona galerie: výběr hotové fotky (toto pole nemá "capture", takže otevře galerii)
function pickFromGallery() {
    document.getElementById('cameraGalleryInput').click();
}

document.getElementById('cameraGalleryInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    e.target.value = '';           // ať jde vybrat stejnou fotku znovu
    sendFileToEditor(file);
});

// Esc zavře okno fotoaparátu
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('cameraModal').style.display === 'flex') {
        closeCamera();
    }
});

// při přepnutí na jinou aplikaci / kartu kameru vypnout (šetří baterii)
document.addEventListener('visibilitychange', function () {
    if (document.hidden && document.getElementById('cameraModal').style.display === 'flex') {
        stopCamera();
    } else if (!document.hidden && document.getElementById('cameraModal').style.display === 'flex') {
        startCamera();
    }
});