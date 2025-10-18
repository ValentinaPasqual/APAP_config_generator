// step3Manager.js - Step 3: Immagini
import { setFile, setMultipleFiles, removeFileByIndex, getMultiple, projectData } from '../dataStore.js';

export function validateStep3() {
  if (!projectData.files.logo) {
    alert('Carica il logo!');
    return false;
  }
  return true;
}

export async function handleFileUpload(type, file) {
  if (!file) return;
  setFile(type, file);
  document.getElementById(type + 'Upload')?.classList.add('has-file');
  document.getElementById(type + 'Info') && (document.getElementById(type + 'Info').textContent = '✓ ' + file.name);
}

export function handleMultipleFiles(type, files) {
  if (!files || files.length === 0) return;
  setMultipleFiles(type, files);
  const listEl = document.getElementById(type + 'List');
  if (listEl) listEl.innerHTML = '';
  document.getElementById(type + 'Info') && (document.getElementById(type + 'Info').textContent = `✓ ${files.length} file`);
  Array.from(files).forEach((file, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `<span>${file.name}</span><button data-type="${type}" data-index="${i}" class="remove-file-btn">Rimuovi</button>`;
    listEl.appendChild(item);
  });

  listEl?.querySelectorAll('.remove-file-btn')?.forEach(btn => {
    btn.removeEventListener('click', onRemoveBtn);
    btn.addEventListener('click', onRemoveBtn);
  });

  function onRemoveBtn(ev) {
    const t = ev.currentTarget.getAttribute('data-type');
    const idx = parseInt(ev.currentTarget.getAttribute('data-index'), 10);
    removeFileByIndex(t, idx);
    handleMultipleFiles(t, getMultiple(t));
  }
}

export function removeFile(type, index) {
  removeFileByIndex(type, index);
  handleMultipleFiles(type, getMultiple(type));
}

export function toggleOptional(section) {
  const checkbox = document.getElementById('enable' + section.charAt(0).toUpperCase() + section.slice(1));
  const content = document.getElementById(section + 'Content');
  if (content) content.classList.toggle('active', checkbox?.checked);
}

// 🎯 Popola lo step 3 quando ci arrivi
export function populateStep3Form() {
  console.log('🎨 Popolamento step 3 (immagini)');
  
  // 1️⃣ Popola il logo se esiste
  if (projectData.files.logo) {
    const uploadDiv = document.getElementById('logoUpload');
    if (uploadDiv) {
      uploadDiv.classList.add('has-file');
    }
    
    const infoEl = document.getElementById('logoInfo');
    if (infoEl) {
      infoEl.textContent = '✓ ' + projectData.files.logo.name;
    }
    
    console.log('✅ Logo popolato:', projectData.files.logo.name);
  }
  
  // 2️⃣ Popola i file istituzionali se esistono
  if (projectData.files.institutional && projectData.files.institutional.length > 0) {
    const enableInst = document.getElementById('enableInstitutional');
    if (enableInst && !enableInst.checked) {
      enableInst.checked = true;
      // Trigger manuale del toggle dopo aver impostato checked
      const content = document.getElementById('institutionalContent');
      if (content) {
        content.classList.add('active');
      }
    }
    
    // 🎯 Popola la lista dei file dopo aver abilitato la sezione
    setTimeout(() => {
      const listEl = document.getElementById('institutionalList');
      if (listEl) {
        listEl.innerHTML = '';
        
        const infoEl = document.getElementById('institutionalInfo');
        if (infoEl) {
          infoEl.textContent = `✓ ${projectData.files.institutional.length} file`;
        }
        
        projectData.files.institutional.forEach((file, i) => {
          const item = document.createElement('div');
          item.className = 'file-item';
          item.innerHTML = `<span>${file.name}</span><button data-type="institutional" data-index="${i}" class="remove-file-btn">Rimuovi</button>`;
          listEl.appendChild(item);
        });
        
        // Aggiungi event listeners ai bottoni rimuovi
        listEl.querySelectorAll('.remove-file-btn').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            const idx = parseInt(ev.currentTarget.getAttribute('data-index'), 10);
            removeFileByIndex('institutional', idx);
            populateStep3Form(); // Re-popola dopo la rimozione
          });
        });
        
        console.log('✅ File istituzionali popolati:', projectData.files.institutional.length);
      }
    }, 50);
  }
  
  console.log('✅ Step 3 completamente popolato');
}