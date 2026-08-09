const imageUpload = document.getElementById('image-upload');
const dropZone = document.getElementById('drop-zone');
const workspace = document.getElementById('workspace');
const sourceImage = document.getElementById('source-image');
const overlayCanvas = document.getElementById('overlay-canvas');
const loader = document.getElementById('loader');
const loadingText = document.getElementById('loading-text');
const countOutput = document.getElementById('count-output');
const refreshBtn = document.getElementById('refresh-btn');
const reanalyzeBtn = document.getElementById('reanalyze-btn');

let modelsLoaded = false;

// Load Face-API models from CDN repository
async function loadModels() {
    loader.classList.remove('hidden');
    loadingText.innerText = "Loading AI Detection Models...";
    
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
    try {
        await face-api.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        loader.classList.add('hidden');
    } catch (error) {
        console.error(error);
        loadingText.innerText = "Failed to load models. Check connection.";
    }
}

loadModels();

// Handle File Selection via Browse or Drag/Drop
imageUpload.addEventListener('change', (e) => handleImage(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#cbd5e1';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#cbd5e1';
    if (e.dataTransfer.files.length) {
        handleImage(e.dataTransfer.files[0]);
    }
});

function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        sourceImage.src = e.target.result;
        dropZone.classList.add('hidden');
        workspace.classList.remove('hidden');
        
        sourceImage.onload = async () => {
            await detectFaces();
        };
    };
    reader.readAsDataURL(file);
}

// Face Detection Core logic
async function detectFaces() {
    if (!modelsLoaded) {
        alert("Models are still loading, please wait a second.");
        return;
    }

    loader.classList.remove('hidden');
    loadingText.innerText = "Scanning faces in photo...";

    // Configure detector options (TinyFaceDetector is lightweight & fast)
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
    const detections = await faceapi.detectAllFaces(sourceImage, options);

    loader.classList.add('hidden');
    countOutput.innerText = detections.length;
    reanalyzeBtn.removeAttribute('disabled');

    // Match canvas dimensions to actual rendered image size
    overlayCanvas.width = sourceImage.width;
    overlayCanvas.height = sourceImage.height;
    
    const displaySize = { width: sourceImage.width, height: sourceImage.height };
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw stylish boxes over detected faces
    resizedDetections.forEach((detection, index) => {
        const box = detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { 
            boxColor: '#ec4899', 
            lineWidth: 3,
            label: `#${index + 1}` 
        });
        drawBox.draw(overlayCanvas);
    });
}

// Re-scan trigger
reanalyzeBtn.addEventListener('click', async () => {
    if (sourceImage.src) await detectFaces();
});

// Full Reset
refreshBtn.addEventListener('click', () => {
    imageUpload.value = '';
    sourceImage.src = '';
    workspace.classList.add('hidden');
    dropZone.classList.remove('hidden');
    loader.classList.add('hidden');
    countOutput.innerText = '0';
    reanalyzeBtn.setAttribute('disabled', 'true');
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
});
