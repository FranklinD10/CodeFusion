const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const mergeButton = document.getElementById('mergeButton');
const downloadLink = document.getElementById('downloadLink');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;
});

mergeButton.addEventListener('click', () => {
    const files = fileInput.files;
    if (files.length === 0) {
        alert('Please select some files first.');
        return;
    }

    let mergedContent = '';
    const promises = [];
    progress.style.display = 'block';
    progressBar.style.width = '0%';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const promise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                mergedContent += `\n--- Start of ${file.name} ---\n`;
                mergedContent += event.target.result;
                mergedContent += `\n--- End of ${file.name} ---\n`;
                progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
                resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
        promises.push(promise);
    }

    Promise.all(promises).then(() => {
        const blob = new Blob([mergedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'merged.txt';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download Merged File';
        progress.style.display = 'none';
    }).catch(error => {
        console.error('Error reading files:', error);
        progress.style.display = 'none';
    });
});
