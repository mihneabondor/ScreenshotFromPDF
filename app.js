const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('pdf-canvas');
const screenshotBtn = document.getElementById('screenshot-btn');
const screenshotsDiv = document.getElementById('screenshots');
const selectionDiv = document.getElementById('selection');
const page = document.getElementById('page')
const zoom = document.getElementById('zoom')
let pdfDoc = null;
let pageNum = 1;
let canvasContext;
let file;
let startX, startY, endX, endY, isSelecting = false;
let drawStartX, drawStartY, drawEndX, drawEndY;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

function renderPage(num) {
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: Number(zoom.value) });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        };
        canvasContext = renderContext.canvasContext;
        page.render(renderContext);
    });
}

zoom.addEventListener('change', (e) => {
    const fileReader = new FileReader();

    fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdfDoc = pdf;
            renderPage(Number(page.value));
        });
    };

    fileReader.readAsArrayBuffer(file);
})

page.addEventListener('change', (e) => {
    const fileReader = new FileReader();

    fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdfDoc = pdf;
            renderPage(Number(page.value));
        });
    };

    fileReader.readAsArrayBuffer(file);
})

fileInput.addEventListener('change', (e) => {
    file = e.target.files[0];
    if (file.type !== 'application/pdf') {
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdfDoc = pdf;
            renderPage(pageNum);
        });
    };

    fileReader.readAsArrayBuffer(file);
});

canvas.addEventListener('mousedown', (e) => {
    startX = e.offsetX;
    startY = e.offsetY;

    drawStartX = e.pageX
    drawStartY = e.pageY
    isSelecting = true;
    selectionDiv.style.left = `${drawStartX}px`;
    selectionDiv.style.top = `${drawStartY}px`;
    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    selectionDiv.style.display = 'block';
});

canvas.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    endX = e.offsetX;
    endY = e.offsetY;

    drawEndX = e.pageX
    drawEndY = e.pageY
    selectionDiv.style.width = `${Math.abs(drawEndX - drawStartX)}px`;
    selectionDiv.style.height = `${Math.abs(drawEndY - drawStartY)}px`;
    selectionDiv.style.left = `${Math.min(drawStartX, drawEndX)}px`;
    selectionDiv.style.top = `${Math.min(drawStartY, drawEndY)}px`;
});

selectionDiv.addEventListener('mouseup', () => {
    isSelecting = false;
});

canvas.addEventListener('mouseup', () => {
    isSelecting = false;
});

function handleScreenshot() {
    if (!startX || !startY || !endX || !endY) {
        return;
    }

    let rect = canvas.getBoundingClientRect()
    const selectionWidth = rect.width - rect.left;
    const selectionHeight = Math.abs(endY - startY);
    const screenshotCanvas = document.createElement('canvas');
    screenshotCanvas.width = selectionWidth;
    screenshotCanvas.height = selectionHeight;
    const screenshotContext = screenshotCanvas.getContext('2d');
    screenshotContext.drawImage(canvas,rect.left, Math.min(startY, endY), selectionWidth, selectionHeight, 0, 0, selectionWidth, selectionHeight);
    const screenshotData = screenshotCanvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = screenshotData;
    screenshotsDiv.appendChild(imgElement);

    const downloadLink = document.createElement('a');
    downloadLink.href = screenshotData;
    downloadLink.download = 'screenshot.png';
    downloadLink.innerHTML = 'Download';
    screenshotsDiv.appendChild(downloadLink);
    screenshotsDiv.appendChild(document.createElement('br'));
    screenshotsDiv.appendChild(document.createElement('br'));

    startX = startY = endX = endY = null;
    selectionDiv.style.display = 'none';
}

screenshotBtn.addEventListener('click', () => {
    handleScreenshot()
});

addEventListener("keypress", (event) => {
    if(event.key === 'Enter')
        handleScreenshot()
});
