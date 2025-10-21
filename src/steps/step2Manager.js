// step2Manager.js - Step 2: Dati (TSV files)
import { setFile, projectData } from '../dataStore.js';

// Popola lo step 2 quando ci arrivi
export async function populateStep2Form() {
  console.log('🎨 Popolamento step 2');
  
  // Mostra preview locations se esiste
  if (projectData.files.locations) {
    const uploadDiv = document.getElementById('locationsUpload');
    if (uploadDiv) uploadDiv.classList.add('has-file');
    
    const infoEl = document.getElementById('locationsInfo');
    if (infoEl) infoEl.textContent = '✓ ' + projectData.files.locations.name;
    
    await showTSVPreview('locations', projectData.files.locations);
  }
  
  // Mostra preview references se esiste
  if (projectData.files.references) {
    const uploadDiv = document.getElementById('referencesUpload');
    if (uploadDiv) uploadDiv.classList.add('has-file');
    
    const infoEl = document.getElementById('referencesInfo');
    if (infoEl) infoEl.textContent = '✓ ' + projectData.files.references.name;
    
    await showTSVPreview('references', projectData.files.references);
  }
}

export function validateStep2() {
  if (!projectData.files.locations || !projectData.files.references) {
    alert('Carica i file TSV!');
    return false;
  }
  
  // 🎯 Salva i separatori multivalore prima di passare allo step successivo
  try {
    projectData.multivalueSeparators = getMultivalueSeparators();
    console.log('💾 Separatori multivalore salvati:', projectData.multivalueSeparators);
  } catch (error) {
    alert(error.message);
    return false;
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

    let tableHTML = '<div class="table-scroll">';
    tableHTML += '<table class="preview-table">';
    tableHTML += '<thead><tr>';
    
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
      
      // 🎯 Se ci sono separatori nel config, popola il form
      if (projectData.config?.datasetConfig?.multivalue_rows) {
        populateMultivalueSeparators();
      }
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

// 🎯 NUOVA FUNZIONE: Popola i separatori multivalore dal config
export function populateMultivalueSeparators() {
  if (!projectData.config?.datasetConfig?.multivalue_rows) {
    console.log('ℹ️ Nessun separatore multivalore da caricare');
    return;
  }
  
  console.log('🎨 Popolamento separatori multivalore dal config');
  
  const listContainer = document.getElementById('separatorsList');
  if (!listContainer) {
    console.warn('⚠️ Container separatorsList non trovato');
    return;
  }
  
  // Pulisci eventuali righe esistenti
  listContainer.innerHTML = '';
  
  const multivalueRows = projectData.config.datasetConfig.multivalue_rows;
  
  // Crea una riga per ogni separatore nel config
  Object.entries(multivalueRows).forEach(([columnName, separator]) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'separator-row';
    rowDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
    
    rowDiv.innerHTML = `
      <input type="text" 
             list="columnSuggestions" 
             placeholder="Nome colonna" 
             class="separator-column"
             value="${columnName}"
             style="flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
      <input type="text" 
             placeholder="Separatore (es: , o ; )" 
             class="separator-value"
             value="${separator}"
             style="flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
      <button type="button" 
              onclick="this.parentElement.remove()" 
              style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
        Rimuovi
      </button>
    `;
    
    listContainer.appendChild(rowDiv);
    console.log(`✅ Separatore aggiunto: ${columnName} = "${separator}"`);
  });
  
  console.log('✅ Separatori multivalore popolati');
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
  
  // 🎯 Combina le colonne di entrambi i dataset
  const locationsColumns = projectData.locationsHeaders || [];
  const referencesColumns = projectData.referencesHeaders || [];
  const allAvailableColumns = [...new Set([...locationsColumns, ...referencesColumns])];
  
  rows.forEach(row => {
    const columnInput = row.querySelector('.separator-column');
    const valueInput = row.querySelector('.separator-value');
    
    if (columnInput && valueInput) {
      const columnName = columnInput.value.trim();
      const separatorValue = valueInput.value.trim();
      
      if (columnName && separatorValue) {
        // ✅ Controlla che la colonna esista in locations.tsv O references.tsv
        if (allAvailableColumns.length > 0 && !allAvailableColumns.includes(columnName)) {
          const locationsMsg = locationsColumns.length > 0 ? `\n\nColonne in locations.tsv: ${locationsColumns.join(', ')}` : '';
          const referencesMsg = referencesColumns.length > 0 ? `\n\nColonne in references.tsv: ${referencesColumns.join(', ')}` : '';
          
          throw new Error(
            `❌ La colonna "${columnName}" non esiste né in locations.tsv né in references.tsv.` +
            locationsMsg +
            referencesMsg
          );
        }
        
        separators[columnName] = separatorValue;
      }
    }
  });
  
  return separators;
}