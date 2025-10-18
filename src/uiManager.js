// uiManager.js
import { setFile, setMultipleFiles, removeFileByIndex, getFile, getMultiple, projectData } from './dataStore.js';

export function startFromScratch() {
  goToStep(1);
}

export function goToStep(stepNumber) {
  const steps = document.querySelectorAll('.step');
  const psteps = document.querySelectorAll('.progress-step');

  steps.forEach(s => s.classList.remove('active'));
  psteps.forEach(s => { s.classList.remove('active'); s.classList.remove('completed'); });

  const index = stepNumber;
  if (steps[index]) steps[index].classList.add('active');
  if (psteps[index]) psteps[index].classList.add('active');

  for (let i = 0; i < index; i++) {
    if (psteps[i]) psteps[i].classList.add('completed');
  }
}

export function nextStep(from) {
  if (!validateStep(from)) return;

  const steps = document.querySelectorAll('.step');
  const psteps = document.querySelectorAll('.progress-step');

  if (steps[from]) steps[from].classList.remove('active');
  if (psteps[from]) { psteps[from].classList.remove('active'); psteps[from].classList.add('completed'); }

  const current = from + 1;
  if (steps[current]) steps[current].classList.add('active');
  if (psteps[current]) psteps[current].classList.add('active');

  if (from === 7) updateSummary();
}

export function prevStep(from) {
  const steps = document.querySelectorAll('.step');
  const psteps = document.querySelectorAll('.progress-step');

  if (steps[from]) steps[from].classList.remove('active');
  if (psteps[from]) psteps[from].classList.remove('active');

  const target = from - 1;
  if (steps[target]) steps[target].classList.add('active');
  if (psteps[target]) psteps[target].classList.add('active');
  if (psteps[target]) psteps[target].classList.remove('completed');
}

export function validateStep(step) {
  if (step === 1) {
    const required = ['shortTitle', 'projectTitle', 'projectSubtitle', 'projectDescription'];
    for (let field of required) {
      const element = document.getElementById(field);
      if (!element) {
        console.warn(`Field ${field} not found`);
        continue;
      }
      if (!element.value.trim()) {
        alert('Compila tutti i campi obbligatori!');
        return false;
      }
    }
  } else if (step === 2) {
    if (!projectData.files.locations || !projectData.files.references) {
      alert('Carica i file TSV!');
      return false;
    }
  } else if (step === 3) {
    if (!projectData.files.logo) {
      alert('Carica il logo!');
      return false;
    }
  } else if (step === 4) {
    const lat = document.getElementById('latitude')?.value;
    const lon = document.getElementById('longitude')?.value;
    const zoom = document.getElementById('zoom')?.value;
    
    if (!lat || !lon || !zoom) {
      alert('Completa la configurazione della mappa!');
      return false;
    }
  }
  return true;
}

export async function handleFileUpload(type, file) {
  if (!file) return;
  setFile(type, file);
  document.getElementById(type + 'Upload')?.classList.add('has-file');
  document.getElementById(type + 'Info') && (document.getElementById(type + 'Info').textContent = '✓ ' + file.name);

  if (type === 'locations' || type === 'references') {
    await showTSVPreview(type, file);
  }
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

export function getTileLayers() {
  const tileLayers = {
    "Default": {
      "tileLayer": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "attribution": "© OpenStreetMap contributors"
    }
  };

  const terrainCheckbox = document.getElementById('enableTerrain');
  if (terrainCheckbox && terrainCheckbox.checked) {
    tileLayers["Terrain"] = {
      "tileLayer": "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      "attribution": "© OpenTopoMap (CC-BY-SA)"
    };
  }

  const cartoDBCheckbox = document.getElementById('enableCartoDB');
  if (cartoDBCheckbox && cartoDBCheckbox.checked) {
    tileLayers["CartoDB_Positron"] = {
      "tileLayer": "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "attribution": "© OpenStreetMap © CartoDB"
    };
  }

  return tileLayers;
}

function resetFile(type) {
  setFile(type, null);
  document.getElementById(type + 'Upload')?.classList.remove('has-file');
  document.getElementById(type + 'Info') && (document.getElementById(type + 'Info').textContent = '');
  const previewContainer = document.getElementById(type + 'Preview');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
  }
  
  if (type === 'locations') {
    projectData.locationsHeaders = [];
    projectData.sharedColumn = null;
  } else if (type === 'references') {
    projectData.referencesHeaders = [];
    projectData.sharedColumn = null;
  }
}

export async function showTSVPreview(type, file, skipRerender = false) {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    const headers = lines[0].split('\t').map(h => h.trim());
    
    if (type === 'locations') {
      projectData.locationsHeaders = headers;
    } else if (type === 'references') {
      projectData.referencesHeaders = headers;
    }
    
    if (type === 'locations') {
      const requiredColumns = ['Location', 'lat_long'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        alert(`❌ Errore: Il file locations.tsv manca delle colonne obbligatorie: ${missingColumns.join(', ')}\n\nRicarica il file aggiungendo queste colonne.`);
        resetFile(type);
        return;
      }
    }
    
    if (type === 'references') {
      if (!headers.includes('pivot_ID')) {
        alert(`❌ Errore: Il file references.tsv deve contenere la colonna obbligatoria "pivot_ID"\n\nRicarica il file aggiungendo questa colonna.`);
        resetFile(type);
        return;
      }
      
      if (projectData.locationsHeaders && projectData.locationsHeaders.length > 0) {
        const sharedColumns = headers.filter(h => projectData.locationsHeaders.includes(h));
        
        if (sharedColumns.length === 0) {
          alert(`❌ Errore: Non c'è nessuna colonna condivisa tra locations.tsv e references.tsv.\n\nI due dataset devono avere almeno una colonna in comune per poter essere collegati.\n\nRicarica i file assicurandoti che abbiano una colonna con lo stesso nome.`);
          resetFile(type);
          return;
        }
        
        projectData.sharedColumn = sharedColumns[0];
        console.log(`✅ Colonna condivisa trovata: ${projectData.sharedColumn}`);
        
        if (sharedColumns.length > 1) {
          console.log(`ℹ️ Multiple colonne condivise trovate: ${sharedColumns.join(', ')}. Utilizzando: ${projectData.sharedColumn}`);
        }
        
        // Re-render locations preview to show SHARED badge (only if not already re-rendering)
        if (!skipRerender) {
          const locationsPreview = document.getElementById('locationsPreview');
          if (locationsPreview && projectData.files.locations) {
            await showTSVPreview('locations', projectData.files.locations, true);
          }
        }
      }
    }
    
    if (type === 'locations' && projectData.referencesHeaders && projectData.referencesHeaders.length > 0) {
      const sharedColumns = headers.filter(h => projectData.referencesHeaders.includes(h));
      
      if (sharedColumns.length === 0) {
        alert(`❌ Errore: Non c'è nessuna colonna condivisa tra locations.tsv e references.tsv.\n\nI due dataset devono avere almeno una colonna in comune per poter essere collegati.\n\nRicarica i file assicurandoti che abbiano una colonna con lo stesso nome.`);
        resetFile(type);
        return;
      }
      
      projectData.sharedColumn = sharedColumns[0];
      console.log(`✅ Colonna condivisa trovata: ${projectData.sharedColumn}`);
      
      if (sharedColumns.length > 1) {
        console.log(`ℹ️ Multiple colonne condivise trovate: ${sharedColumns.join(', ')}. Utilizzando: ${projectData.sharedColumn}`);
      }
      
      // Re-render references preview to show SHARED badge (only if not already re-rendering)
      if (!skipRerender) {
        const referencesPreview = document.getElementById('referencesPreview');
        if (referencesPreview && projectData.files.references) {
          await showTSVPreview('references', projectData.files.references, true);
        }
      }
    }
    
    const rows = lines.slice(1, 3).map(line => line.split('\t'));

    const previewContainer = document.getElementById(type + 'Preview');
    if (!previewContainer) return;

    let validationHTML = '<div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px;">';
    validationHTML += '<strong>✅ Validazione superata!</strong><br>';
    
    if (type === 'locations') {
      validationHTML += `Colonne obbligatorie trovate: <strong>Location, lat_long</strong>`;
    } else if (type === 'references') {
      validationHTML += `Colonna obbligatoria trovata: <strong>pivot_ID</strong>`;
      if (projectData.sharedColumn) {
        validationHTML += `<br>Colonna condivisa con locations.tsv: <strong>${projectData.sharedColumn}</strong> ✓`;
      }
    }
    
    validationHTML += '</div>';

    let tableHTML = '<div class="table-scroll" style="overflow-x: auto; max-width: 100%; border: 1px solid #dee2e6; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">';
    tableHTML += '<table class="preview-table" style="width: 100%; border-collapse: collapse; margin: 0;">';
    tableHTML += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">';
    
    const requiredCols = type === 'locations' ? ['Location', 'lat_long'] : ['pivot_ID'];
    const sharedCol = projectData.sharedColumn;
    
    headers.forEach((header, index) => {
      const isRequired = requiredCols.includes(header);
      const isShared = header === sharedCol;
      
      let badge = '';
      if (isRequired) {
        badge = ' <span style="background: #28a745; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">REQUIRED</span>';
      } else if (isShared) {
        badge = ' <span style="background: #17a2b8; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">SHARED</span>';
      }
      
      tableHTML += `<th style="padding: 14px 16px; text-align: left; font-weight: 600; border-bottom: 2px solid rgba(255,255,255,0.3); ${index > 0 ? 'border-left: 1px solid rgba(255,255,255,0.1);' : ''}">${header}${badge}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    rows.forEach((row, rowIndex) => {
      const rowBg = rowIndex % 2 === 0 ? '#f8f9fa' : 'white';
      tableHTML += `<tr style="background: ${rowBg}; transition: background 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='${rowBg}'">`;
      row.forEach((cell, cellIndex) => {
        const truncatedCell = (cell || '').length > 50 ? (cell || '').substring(0, 47) + '...' : (cell || '');
        tableHTML += `<td style="padding: 12px 16px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${cellIndex > 0 ? 'border-left: 1px solid #dee2e6;' : ''}" title="${(cell || '').replace(/"/g, '&quot;')}">${truncatedCell || '<span style="color: #adb5bd; font-style: italic;">empty</span>'}</td>`;
      });
      tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
    
    const totalRows = lines.length - 1;
    const footerHTML = `<div style="margin-top: 10px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; font-size: 13px; color: #6c757d;">
      <strong>Anteprima:</strong> Prime 2 righe di ${totalRows} totali | <strong>Colonne:</strong> ${headers.length}
    </div>`;
    
    previewContainer.innerHTML = validationHTML + tableHTML + footerHTML;
    previewContainer.style.display = 'block';
    
    if (type === 'locations') {
      updateMultivalueColumnsDropdown(headers);
    }
  } catch (error) {
    console.error('Error showing preview:', error);
  }
}

export function updateMultivalueColumnsDropdown(headers) {
  const container = document.getElementById('multivalueSeparators');
  if (!container) return;
  
  const listContainer = document.getElementById('separatorsList');
  if (listContainer) {
    const datalist = document.getElementById('columnSuggestions');
    if (datalist) {
      datalist.innerHTML = '';
      headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        datalist.appendChild(option);
      });
    }
  }
}

export function addSeparatorRow() {
  const listContainer = document.getElementById('separatorsList');
  if (!listContainer) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'separator-row';
  rowDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
  
  rowDiv.innerHTML = `
    <input type="text" 
           list="columnSuggestions" 
           placeholder="Nome colonna" 
           class="separator-column"
           style="flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <input type="text" 
           placeholder="Separatore (es: , o ; )" 
           class="separator-value"
           style="flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <button type="button" 
            onclick="this.parentElement.remove()" 
            style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
      Rimuovi
    </button>
  `;
  
  listContainer.appendChild(rowDiv);
}

export function getMultivalueSeparators() {
  const separators = {};
  const rows = document.querySelectorAll('.separator-row');
  const availableColumns = projectData.locationsHeaders || [];
  
  rows.forEach(row => {
    const columnInput = row.querySelector('.separator-column');
    const valueInput = row.querySelector('.separator-value');
    
    if (columnInput && valueInput) {
      const columnName = columnInput.value.trim();
      const separatorValue = valueInput.value.trim();
      
      if (columnName && separatorValue) {
        if (availableColumns.length > 0 && !availableColumns.includes(columnName)) {
          throw new Error(`La colonna "${columnName}" non esiste nel dataset locations.tsv. Colonne disponibili: ${availableColumns.join(', ')}`);
        }
        separators[columnName] = separatorValue;
      }
    }
  });
  
  return separators;
}

export function addFilterRow() {
  const listContainer = document.getElementById('filtersList');
  if (!listContainer) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'filter-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 2fr 1fr 1fr; gap: 10px; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #dee2e6; align-items: start;';
  
  rowDiv.innerHTML = `
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">Nome Colonna</label>
      <input type="text" 
             list="filterColumnSuggestions" 
             placeholder="es. Location" 
             class="filter-column"
             style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
      <div class="column-validation" style="margin-top: 5px; font-size: 12px; display: none;"></div>
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">Title</label>
      <input type="text" 
             placeholder="es. I luoghi" 
             class="filter-title"
             style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">Category</label>
      <input type="text" 
             placeholder="es. Gli spazi narrati" 
             class="filter-category"
             style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">Tipo</label>
      <select class="filter-type" style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px; background: white;">
        <option value="simple">Simple</option>
        <option value="taxonomy">Taxonomy</option>
        <option value="range">Range</option>
      </select>
    </div>
    <div style="display: flex; align-items: flex-end;">
      <button type="button" 
              onclick="this.closest('.filter-row').remove()" 
              style="width: 100%; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
        ✕
      </button>
    </div>
  `;
  
  listContainer.appendChild(rowDiv);
  
  const columnInput = rowDiv.querySelector('.filter-column');
  if (columnInput) {
    columnInput.addEventListener('input', function() {
      validateFilterColumn(this);
    });
    columnInput.addEventListener('blur', function() {
      validateFilterColumn(this);
    });
  }
}

function validateFilterColumn(input) {
  const columnName = input.value.trim();
  const validationDiv = input.parentElement.querySelector('.column-validation');
  const availableColumns = [...(projectData.locationsHeaders || []), ...(projectData.referencesHeaders || [])];
  
  if (!columnName) {
    validationDiv.style.display = 'none';
    input.style.borderColor = '#dee2e6';
    return true;
  }
  
  const isValid = availableColumns.includes(columnName);
  
  if (isValid) {
    validationDiv.innerHTML = '✓ Colonna trovata';
    validationDiv.style.color = '#28a745';
    validationDiv.style.display = 'block';
    input.style.borderColor = '#28a745';
    return true;
  } else {
    validationDiv.innerHTML = '✗ Colonna non trovata nei dataset';
    validationDiv.style.color = '#dc3545';
    validationDiv.style.display = 'block';
    input.style.borderColor = '#dc3545';
    return false;
  }
}

export function getFiltersConfig() {
  const filters = {};
  const rows = document.querySelectorAll('.filter-row');
  const availableColumns = [...(projectData.locationsHeaders || []), ...(projectData.referencesHeaders || [])];
  
  rows.forEach(row => {
    const columnInput = row.querySelector('.filter-column');
    const titleInput = row.querySelector('.filter-title');
    const categoryInput = row.querySelector('.filter-category');
    const typeSelect = row.querySelector('.filter-type');
    
    if (columnInput && titleInput && categoryInput && typeSelect) {
      const columnName = columnInput.value.trim();
      const title = titleInput.value.trim();
      const category = categoryInput.value.trim();
      const type = typeSelect.value;
      
      if (columnName && title && category) {
        if (availableColumns.length > 0 && !availableColumns.includes(columnName)) {
          console.error(`Column "${columnName}" not found. Available:`, availableColumns);
          throw new Error(`La colonna "${columnName}" non esiste nei dataset. Colonne disponibili: ${availableColumns.join(', ')}`);
        }
        
        filters[columnName] = {
          title: title,
          category: category,
          size: 500,
          conjunction: false,
          type: type
        };
      }
    }
  });
  
  return filters;
}

// export async function showDatasetPreviews() {
//   // For step 5
//   const locContainer5 = document.getElementById('locationsPreviewStep5');
//   const refContainer5 = document.getElementById('referencesPreviewStep5');
  
//   if (locContainer5 && projectData.files.locations) {
//     await showTSVPreviewCompact('locations', projectData.files.locations, locContainer5);
//   }
  
//   if (refContainer5 && projectData.files.references) {
//     await showTSVPreviewCompact('references', projectData.files.references, refContainer5);
//   }
  
//   updateFilterColumnsDatalist();
// }

// async function showTSVPreviewCompact(type, file, container) {
//   try {
//     const text = await file.text();
//     const lines = text.split('\n').filter(line => line.trim());
//     if (lines.length === 0) return;

//     const headers = lines[0].split('\t').map(h => h.trim());
//     const rows = lines.slice(1, 3).map(line => line.split('\t'));

//     const requiredCols = type === 'locations' ? ['Location', 'lat_long'] : ['pivot_ID'];
//     const sharedCol = projectData.sharedColumn;

//     let tableHTML = '<div style="overflow-x: auto; max-width: 100%; border: 1px solid #dee2e6; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">';
//     tableHTML += '<table style="width: 100%; border-collapse: collapse; margin: 0; font-size: 13px;">';
//     tableHTML += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">';
    
//     headers.forEach((header, index) => {
//       const isRequired = requiredCols.includes(header);
//       const isShared = header === sharedCol;
      
//       let badge = '';
//       if (isRequired) {
//         badge = ' <span style="background: #28a745; padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: bold;">REQ</span>';
//       } else if (isShared) {
//         badge = ' <span style="background: #17a2b8; padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: bold;">SHR</span>';
//       }
      
//       tableHTML += `<th style="padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid rgba(255,255,255,0.3); ${index > 0 ? 'border-left: 1px solid rgba(255,255,255,0.1);' : ''}">${header}${badge}</th>`;
//     });
//     tableHTML += '</tr></thead><tbody>';

//     rows.forEach((row, rowIndex) => {
//       const rowBg = rowIndex % 2 === 0 ? '#f8f9fa' : 'white';
//       tableHTML += `<tr style="background: ${rowBg};">`;
//       row.forEach((cell, cellIndex) => {
//         const truncatedCell = (cell || '').length > 30 ? (cell || '').substring(0, 27) + '...' : (cell || '');
//         tableHTML += `<td style="padding: 8px 12px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${cellIndex > 0 ? 'border-left: 1px solid #dee2e6;' : ''}" title="${(cell || '').replace(/"/g, '&quot;')}">${truncatedCell || '<span style="color: #adb5bd; font-style: italic;">empty</span>'}</td>`;
//       });
//       tableHTML += '</tr>';
//     });

//     tableHTML += '</tbody></table></div>';
    
//     const totalRows = lines.length - 1;
//     const footerHTML = `<div style="margin-top: 8px; padding: 6px 10px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #6c757d;">
//       Prime 2 di ${totalRows} righe | ${headers.length} colonne
//     </div>`;
    
//     container.innerHTML = tableHTML + footerHTML;
//   } catch (error) {
//     console.error('Error showing compact preview:', error);
//     container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Errore nel caricamento della preview</div>';
//   }
// }

export function updateFilterColumnsDatalist() {
  const datalist = document.getElementById('filterColumnSuggestions');
  if (!datalist) return;
  
  datalist.innerHTML = '';
  const allColumns = [...(projectData.locationsHeaders || []), ...(projectData.referencesHeaders || [])];
  const uniqueColumns = [...new Set(allColumns)];
  
  uniqueColumns.forEach(column => {
    const option = document.createElement('option');
    option.value = column;
    datalist.appendChild(option);
  });
}

export function addSortingRow() {
  const listContainer = document.getElementById('sortingsList');
  if (!listContainer) return;
  
  const isFirstRow = listContainer.querySelectorAll('.sorting-row').length === 0;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'sorting-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: auto 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center; padding: 10px; background: white; border: 1px solid #dee2e6; border-radius: 6px;';
  
  const refHeaders = projectData.referencesHeaders || [];
  let optionsHTML = '<option value="">-- Seleziona --</option>';
  refHeaders.forEach(header => {
    optionsHTML += `<option value="${header}">${header}</option>`;
  });
  
  rowDiv.innerHTML = `
    <input type="radio" name="defaultSort" class="default-sort-radio" ${isFirstRow ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
    <select class="sorting-field" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px; background: white; width: 100%;">
      ${optionsHTML}
    </select>
    <select class="sorting-order" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px; background: white;">
      <option value="asc">Asc</option>
      <option value="desc">Desc</option>
    </select>
    <button type="button" onclick="this.closest('.sorting-row').remove(); window.uiManager.checkFirstSortingRow()" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
  `;
  
  listContainer.appendChild(rowDiv);
}

export function checkFirstSortingRow() {
  const listContainer = document.getElementById('sortingsList');
  if (!listContainer) return;
  
  const rows = listContainer.querySelectorAll('.sorting-row');
  if (rows.length > 0) {
    const firstRadio = rows[0].querySelector('.default-sort-radio');
    if (firstRadio && !document.querySelector('.default-sort-radio:checked')) {
      firstRadio.checked = true;
    }
  }
}

export function populateResultCardsFields() {
  const refHeaders = projectData.referencesHeaders || [];
  const locHeaders = projectData.locationsHeaders || [];
  
  console.log('Populating with:', { refHeaders, locHeaders });
  
  if (refHeaders.length === 0) {
    console.warn('No references headers found!');
  }
  
  if (locHeaders.length === 0) {
    console.warn('No locations headers found!');
  }
  
  const refFields = ['cardTitle', 'cardSubtitle', 'cardSubtitle2', 'cardDescription'];
  
  refFields.forEach(fieldId => {
    const select = document.getElementById(fieldId);
    if (select) {
      select.innerHTML = '<option value="">-- Seleziona una colonna --</option>';
      refHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      });
      console.log(`Populated ${fieldId} with ${refHeaders.length} options`);
    } else {
      console.warn(`Select ${fieldId} not found`);
    }
  });
  
  const popupSelect = document.getElementById('popupDescription');
  if (popupSelect) {
    popupSelect.innerHTML = '<option value="">-- Seleziona una colonna --</option>';
    locHeaders.forEach(header => {
      const option = document.createElement('option');
      option.value = header;
      option.textContent = header;
      popupSelect.appendChild(option);
    });
    console.log(`Populated popupDescription with ${locHeaders.length} options`);
  } else {
    console.warn('Select popupDescription not found');
  }
  
  populateModalInformation();
}

export function populateModalInformation() {
  const refHeaders = projectData.referencesHeaders || [];
  const locHeaders = projectData.locationsHeaders || [];
  
  console.log('Populating modal info with:', { refHeaders, locHeaders });
  
  const refModalList = document.getElementById('modalInfoListRefs');
  if (refModalList) {
    refModalList.innerHTML = '';
    refHeaders.forEach(header => {
      addModalInfoRowPrefilled(header, header, 'modalInfoListRefs');
    });
    console.log(`Added ${refHeaders.length} rows to modalInfoListRefs`);
  } else {
    console.warn('modalInfoListRefs not found');
  }
  
  const locModalList = document.getElementById('modalInfoListLocs');
  if (locModalList) {
    locModalList.innerHTML = '';
    locHeaders.forEach(header => {
      addModalInfoRowPrefilled(header, header, 'modalInfoListLocs');
    });
    console.log(`Added ${locHeaders.length} rows to modalInfoListLocs`);
  } else {
    console.warn('modalInfoListLocs not found');
  }
}

function addModalInfoRowPrefilled(key, defaultLabel, containerId) {
  const listContainer = document.getElementById(containerId);
  if (!listContainer) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'modal-info-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center; padding: 10px; background: white; border: 1px solid #dee2e6; border-radius: 6px;';
  
  rowDiv.innerHTML = `
    <input type="text" value="${key}" class="modal-key" readonly style="padding: 8px 12px; border: 1px solid #e9ecef; border-radius: 4px; font-size: 14px; background: #f8f9fa; color: #495057;">
    <input type="text" value="${defaultLabel}" placeholder="Label" class="modal-value" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <button type="button" onclick="this.closest('.modal-info-row').remove()" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
  `;
  
  listContainer.appendChild(rowDiv);
}

export function addModalInfoRow() {
  const listContainer = document.getElementById('modalInfoList');
  if (!listContainer) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'modal-info-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center; padding: 10px; background: white; border: 1px solid #dee2e6; border-radius: 6px;';
  
  rowDiv.innerHTML = `
    <input type="text" list="refColumnSuggestions" placeholder="Campo (es. Titolo)" class="modal-key" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <input type="text" placeholder="Label (es. Titolo)" class="modal-value" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <button type="button" onclick="this.closest('.modal-info-row').remove()" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
  `;
  
  listContainer.appendChild(rowDiv);
}

export function addSearchableFieldRow() {
  const listContainer = document.getElementById('searchableFieldsList');
  if (!listContainer) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'searchable-field-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center;';
  
  rowDiv.innerHTML = `
    <input type="text" list="refColumnSuggestions" placeholder="es. Titolo" class="searchable-field" style="padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    <button type="button" onclick="this.closest('.searchable-field-row').remove()" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
  `;
  
  listContainer.appendChild(rowDiv);
}

export function getReferencesConfig() {
  const config = {
    result_cards: {
      card_title: document.getElementById('cardTitle')?.value.trim() || '',
      card_subtitle: document.getElementById('cardSubtitle')?.value.trim() || '',
      card_subtitle_2: document.getElementById('cardSubtitle2')?.value.trim() || '',
      card_description: document.getElementById('cardDescription')?.value.trim() || '',
      popup_description: document.getElementById('popupDescription')?.value.trim() || ''
    },
    searchConfig: {
      debounceTime: 300,
      defaultSort: '',
      sortOptions: []
    },
    resultsDisplay: {
      tagsToShow: []
    },
    sortings: {},
    modal_information: {},
    searchableFields: []
  };
  
  const searchableSet = new Set();
  if (config.result_cards.card_title) searchableSet.add(config.result_cards.card_title);
  if (config.result_cards.card_subtitle) searchableSet.add(config.result_cards.card_subtitle);
  if (config.result_cards.card_subtitle_2) searchableSet.add(config.result_cards.card_subtitle_2);
  config.searchableFields = Array.from(searchableSet);
  
  let defaultSortKey = '';
  document.querySelectorAll('.sorting-row').forEach((row, index) => {
    const field = row.querySelector('.sorting-field')?.value.trim();
    const order = row.querySelector('.sorting-order')?.value;
    const isDefault = row.querySelector('.default-sort-radio')?.checked;
    
    if (field) {
      const key = `${field.toLowerCase().replace(/\s+/g, '_')}_${order}`;
      const label = `${field} (${order === 'asc' ? 'Asc' : 'Desc'})`;
      
      config.sortings[key] = { field, order };
      config.searchConfig.sortOptions.push({ value: key, label });
      
      if (isDefault || index === 0) {
        defaultSortKey = key;
      }
      
      if (!config.resultsDisplay.tagsToShow.includes(field)) {
        config.resultsDisplay.tagsToShow.push(field);
      }
    }
  });
  
  config.searchConfig.defaultSort = defaultSortKey;
  
  const modalInfoRefs = document.getElementById('modalInfoListRefs');
  const modalInfoLocs = document.getElementById('modalInfoListLocs');
  
  if (modalInfoRefs) {
    modalInfoRefs.querySelectorAll('.modal-info-row').forEach(row => {
      const key = row.querySelector('.modal-key')?.value.trim();
      const value = row.querySelector('.modal-value')?.value.trim();
      if (key && value) {
        config.modal_information[key] = value;
      }
    });
  }
  
  if (modalInfoLocs) {
    modalInfoLocs.querySelectorAll('.modal-info-row').forEach(row => {
      const key = row.querySelector('.modal-key')?.value.trim();
      const value = row.querySelector('.modal-value')?.value.trim();
      if (key && value) {
        config.modal_information[key] = value;
      }
    });
  }
  
  return config;
}

export function updateSummary() {
  const shortTitle = document.getElementById('shortTitle')?.value || '';
  const projectTitle = document.getElementById('projectTitle')?.value || '';
  document.getElementById('sum-shortTitle') && (document.getElementById('sum-shortTitle').textContent = shortTitle);
  document.getElementById('sum-projectTitle') && (document.getElementById('sum-projectTitle').textContent = projectTitle);

  const latEl = document.getElementById('latitude');
  const lonEl = document.getElementById('longitude');
  if (latEl && lonEl) {
    document.getElementById('sum-coords') && (document.getElementById('sum-coords').textContent = `${latEl.value}, ${lonEl.value}`);
  } else {
    document.getElementById('sum-coords') && (document.getElementById('sum-coords').textContent = 'Non specificato');
  }

  document.getElementById('sum-locations') && (document.getElementById('sum-locations').textContent = projectData.files.locations ? '✓ ' + projectData.files.locations.name : '✗');
  document.getElementById('sum-references') && (document.getElementById('sum-references').textContent = projectData.files.references ? '✓ ' + projectData.files.references.name : '✗');
  document.getElementById('sum-logo') && (document.getElementById('sum-logo').textContent = projectData.files.logo ? '✓ ' + projectData.files.logo.name : '✗');
  const inst = projectData.files.institutional ? projectData.files.institutional.length : 0;
  document.getElementById('sum-institutional') && (document.getElementById('sum-institutional').textContent = inst > 0 ? `✓ ${inst} file` : 'Nessuno');
}