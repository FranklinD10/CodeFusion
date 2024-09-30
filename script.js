const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const mergeButton = document.getElementById('mergeButton');
const downloadLink = document.getElementById('downloadLink');
const resetButton = document.getElementById('resetButton');
const exportPDFButton = document.getElementById('exportPDFButton');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const loading = document.getElementById('loading');

function isTextFile(file) {
  const textExtensions = [
    'txt', 'js', 'json', 'html', 'css', 'xml', 'md', 'csv', 'log',
    'php', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'sh', 'yaml', 'yml'
  ];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return textExtensions.includes(fileExtension) || file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/javascript';
}

function shouldProcessFile(file) {
  const pathParts = file.webkitRelativePath.split('/');
  return !pathParts.some(part => part.startsWith('.') && part !== '.');
}

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
    displayFileList();
});

fileInput.addEventListener('change', displayFileList);

function displayFileList() {
  fileList.innerHTML = '';
  for (let i = 0; i < fileInput.files.length; i++) {
    const file = fileInput.files[i];
    if (shouldProcessFile(file)) {
      const fileInfo = document.createElement('p');
      fileInfo.textContent = `${file.webkitRelativePath} (${file.type || 'unknown'})`;
      fileList.appendChild(fileInfo);
    }
  }
  fileList.style.display = 'block';
}

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
  loading.style.display = 'block';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!shouldProcessFile(file)) continue;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(`File read successfully: ${file.webkitRelativePath}`);
        if (isTextFile(file)) {
          mergedContent += `\n--- Start of ${file.webkitRelativePath} ---\n`;
          mergedContent += event.target.result;
          mergedContent += `\n--- End of ${file.webkitRelativePath} ---\n`;
        } else {
          mergedContent += `\n--- ${file.webkitRelativePath} is a binary file and cannot be displayed as text ---\n`;
        }
        progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
        resolve();
      };
      reader.onerror = () => {
        console.error(`Error reading file: ${file.webkitRelativePath}`, reader.error);
        reject(reader.error);
      };
      if (isTextFile(file)) {
        reader.readAsText(file);
      } else {
        resolve();
      }
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
    exportPDFButton.style.display = 'block';
    mergeButton.style.display = 'none';
    progress.style.display = 'none';
    loading.style.display = 'none';
    resetButton.style.display = 'block';
  }).catch(error => {
    console.error('Error reading files:', error);
    progress.style.display = 'none';
    loading.style.display = 'none';
  });
});

resetButton.addEventListener('click', () => {
    fileInput.value = '';
    fileList.innerHTML = '';
    fileList.style.display = 'none';
    downloadLink.style.display = 'none';
    exportPDFButton.style.display = 'none';
    resetButton.style.display = 'none';
    mergeButton.style.display = 'block';
});

exportPDFButton.addEventListener('click', () => {
    const files = fileInput.files;
    if (files.length === 0) {
        alert('Please select some files first.');
        return;
    }

    let mergedContent = '';
    const promises = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.split('/')[0];
        const promise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (fileType === 'text' || fileType === 'application') {
                    mergedContent += `\n--- Start of ${file.webkitRelativePath} ---\n`;
                    mergedContent += event.target.result;
                    mergedContent += `\n--- End of ${file.webkitRelativePath} ---\n`;
                } else {
                    mergedContent += `\n--- ${file.webkitRelativePath} is a ${fileType} file and cannot be displayed as text ---\n`;
                }
                resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
        promises.push(promise);
    }

    Promise.all(promises).then(() => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const lines = pdf.splitTextToSize(mergedContent, 180);
        let y = 10;
        lines.forEach(line => {
            if (y > 280) {
                pdf.addPage();
                y = 10;
            }
            pdf.text(line, 10, y);
            y += 10;
        });
        pdf.save('merged.pdf');
    }).catch(error => {
        console.error('Error reading files:', error);
    });
});

// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
  