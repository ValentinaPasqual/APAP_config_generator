// step5Manager.js - Gestione dello step 5 (Filtri)
import { projectData } from '../dataStore.js';

export function validateStep5() {
  try {
    // 🎯 Validazione: deve esserci ALMENO un filtro
    const filters = getFiltersConfig();
    
    if (Object.keys(filters).length === 0) {
      alert('❌ Devi configurare almeno un filtro!');
      return false;
    }
    
    // 🎯 Salva i filtri in projectData
    projectData.filters = filters;
    console.log('💾 Filtri salvati in projectData:', projectData.filters);
    
    return true;
  } catch (error) {
    // 🎯 Mostra popup con l'errore di validazione
    alert(error.message);
    return false;
  }
}

export function updateFilterColumnsDatalist() {
  console.log('updateFilterColumnsDatalist chiamata');
  
  const datalist = document.getElementById('filterColumnSuggestions');
  if (!datalist) {
    console.error('filterColumnSuggestions datalist non trovato!');
    return;
  }
  
  datalist.innerHTML = '';
  const allColumns = [...(projectData.locationsHeaders || []), ...(projectData.referencesHeaders || [])];
  const uniqueColumns = [...new Set(allColumns)];
  
  console.log('Updating filter columns datalist with:', uniqueColumns);
  
  uniqueColumns.forEach(column => {
    const option = document.createElement('option');
    option.value = column;
    datalist.appendChild(option);
  });
}

// 🎯 Popola lo step 5 quando ci arrivi
export async function populateStep5Form() {
  console.log('🎨 Popolamento step 5 (filtri)');
  
  // 1️⃣ Aggiorna il datalist con le colonne disponibili
  updateFilterColumnsDatalist();
  
  // 2️⃣ Cerca i filtri in diversi percorsi possibili
  let aggregations = null;
  
  if (projectData.config?.datasetConfig?.aggregations) {
    aggregations = projectData.config.datasetConfig.aggregations;
    console.log('📋 Filtri trovati in config.datasetConfig.aggregations');
  } else if (projectData.config?.aggregations) {
    aggregations = projectData.config.aggregations;
    console.log('📋 Filtri trovati in config.aggregations');
  } else if (projectData.config?.filters) {
    aggregations = projectData.config.filters;
    console.log('📋 Filtri trovati in config.filters');
  } else if (projectData.config?.search?.aggregations) {
    aggregations = projectData.config.search.aggregations;
    console.log('📋 Filtri trovati in config.search.aggregations');
  }
  
  if (aggregations && Object.keys(aggregations).length > 0) {
    console.log('📋 Caricamento filtri:', aggregations);
    loadFiltersFromConfig(aggregations);
  } else {
    console.log('ℹ️ Nessun filtro da caricare');
  }
  
  console.log('✅ Step 5 completamente popolato');
}

function loadFiltersFromConfig(aggregations) {
  console.log('loadFiltersFromConfig chiamata con:', aggregations);
  
  const listContainer = document.getElementById('filtersList');
  if (!listContainer) {
    console.error('filtersList container non trovato!');
    return;
  }
  
  // Pulisci eventuali filtri esistenti
  listContainer.innerHTML = '';
  console.log('Container pulito, inizio creazione righe...');
  
  // Crea una riga per ogni filtro
  let count = 0;
  Object.entries(aggregations).forEach(([columnName, config]) => {
    console.log(`Creazione filtro ${count + 1}:`, columnName, config);
    
    addFilterRow();
    
    // Trova l'ultima riga aggiunta e popola i campi
    const rows = listContainer.querySelectorAll('.filter-row');
    const lastRow = rows[rows.length - 1];
    
    if (lastRow) {
      const columnSelect = lastRow.querySelector('.filter-column');
      const titleInput = lastRow.querySelector('.filter-title');
      const categoryInput = lastRow.querySelector('.filter-category');
      const typeSelect = lastRow.querySelector('.filter-type');
      
      if (columnSelect) columnSelect.value = columnName;
      if (titleInput) titleInput.value = config.title || '';
      if (categoryInput) categoryInput.value = config.category || '';
      if (typeSelect) typeSelect.value = config.type || 'simple';
      
      // Trigger validation
      if (columnSelect) {
        columnSelect.dispatchEvent(new Event('change'));
      }
      
      console.log(`✅ Filtro ${count + 1} creato e popolato:`, columnName);
      count++;
    } else {
      console.error('Ultima riga non trovata dopo addFilterRow()');
    }
  });
  
  console.log(`✅ Totale filtri caricati: ${count} di ${Object.keys(aggregations).length}`);
}

export function addFilterRow() {
  const listContainer = document.getElementById('filtersList');
  if (!listContainer) return;
  
  // 🎯 Ottieni colonne disponibili per il dropdown
  const allColumns = [...(projectData.locationsHeaders || []), ...(projectData.referencesHeaders || [])];
  const uniqueColumns = [...new Set(allColumns)];
  
  // 🎯 Ottieni colonne già usate
  const usedColumns = getUsedColumns();
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'filter-row';
  rowDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 2fr 1fr 1fr; gap: 10px; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #dee2e6; align-items: start;';
  
  // 🎯 Crea le opzioni del dropdown
  let optionsHTML = '<option value="">-- Seleziona colonna --</option>';
  uniqueColumns.forEach(column => {
    const isUsed = usedColumns.includes(column);
    const disabled = isUsed ? 'disabled' : '';
    const label = isUsed ? `${column} (già usata)` : column;
    optionsHTML += `<option value="${column}" ${disabled}>${label}</option>`;
  });
  
  rowDiv.innerHTML = `
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">
        Nome Colonna <span style="color: #dc3545;">*</span>
      </label>
      <select class="filter-column" required
              style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px; background: white;">
        ${optionsHTML}
      </select>
      <div class="column-validation" style="margin-top: 5px; font-size: 12px; display: none;"></div>
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">
        Title <span style="color: #dc3545;">*</span>
      </label>
      <input type="text" 
             placeholder="es. I luoghi" 
             class="filter-title" required
             style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">
        Category <span style="color: #dc3545;">*</span>
      </label>
      <input type="text" 
             placeholder="es. Gli spazi narrati" 
             class="filter-category" required
             style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">
    </div>
    <div>
      <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #6c757d; font-weight: 600;">
        Tipo <span style="color: #dc3545;">*</span>
      </label>
      <select class="filter-type" required style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px; background: white;">
        <option value="simple">Simple</option>
        <option value="taxonomy">Taxonomy</option>
        <option value="range">Range</option>
      </select>
    </div>
    <div style="display: flex; align-items: flex-end;">
      <button type="button" 
              class="remove-filter-btn"
              style="width: 100%; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
        ✕
      </button>
    </div>
  `;
  
  listContainer.appendChild(rowDiv);
  
  // Event listener per il dropdown
  const columnSelect = rowDiv.querySelector('.filter-column');
  if (columnSelect) {
    columnSelect.addEventListener('change', function() {
      validateFilterColumn(this);
      // Aggiorna tutti i dropdown quando cambia una selezione
      updateAllFilterDropdowns();
    });
  }
  
  // Event listener per il bottone rimuovi
  const removeBtn = rowDiv.querySelector('.remove-filter-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      this.closest('.filter-row').remove();
      // Aggiorna tutti i dropdown dopo la rimozione
      updateAllFilterDropdowns();
    });
  }
}

// 🎯 Ottieni le colonne già utilizzate
function getUsedColumns() {
  const usedColumns = [];
  const rows = document.querySelectorAll('.filter-row');
  
  rows.forEach(row => {
    const columnSelect = row.querySelector('.filter-column');
    if (columnSelect && columnSelect.value) {
      usedColumns.push(columnSelect.value);
    }
  });
  
  return usedColumns;
}

// 🎯 Aggiorna tutti i dropdown per disabilitare colonne usate
function updateAllFilterDropdowns() {
  const usedColumns = getUsedColumns();
  const rows = document.querySelectorAll('.filter-row');
  
  rows.forEach(row => {
    const columnSelect = row.querySelector('.filter-column');
    if (!columnSelect) return;
    
    const currentValue = columnSelect.value;
    const options = columnSelect.querySelectorAll('option');
    
    options.forEach(option => {
      if (option.value === '') return; // Skip placeholder
      
      const isCurrentSelection = option.value === currentValue;
      const isUsed = usedColumns.includes(option.value) && !isCurrentSelection;
      
      option.disabled = isUsed;
      option.textContent = isUsed ? `${option.value} (già usata)` : option.value;
    });
  });
}

function validateFilterColumn(select) {
  const columnName = select.value.trim();
  const validationDiv = select.parentElement.querySelector('.column-validation');
  
  if (!columnName) {
    validationDiv.style.display = 'none';
    select.style.borderColor = '#dee2e6';
    return false;
  }
  
  validationDiv.innerHTML = '✓ Colonna selezionata';
  validationDiv.style.color = '#28a745';
  validationDiv.style.display = 'block';
  select.style.borderColor = '#28a745';
  return true;
}

export function getFiltersConfig() {
  const filters = {};
  const rows = document.querySelectorAll('.filter-row');
  const usedColumns = [];
  
  rows.forEach(row => {
    const columnSelect = row.querySelector('.filter-column');
    const titleInput = row.querySelector('.filter-title');
    const categoryInput = row.querySelector('.filter-category');
    const typeSelect = row.querySelector('.filter-type');
    
    if (columnSelect && titleInput && categoryInput && typeSelect) {
      const columnName = columnSelect.value.trim();
      const title = titleInput.value.trim();
      const category = categoryInput.value.trim();
      const type = typeSelect.value;
      
      // 🎯 Validazione campi obbligatori
      if (!columnName) {
        throw new Error('❌ Seleziona una colonna per tutti i filtri!');
      }
      
      if (!title) {
        throw new Error(`❌ Inserisci il Title per il filtro "${columnName}"!`);
      }
      
      if (!category) {
        throw new Error(`❌ Inserisci la Category per il filtro "${columnName}"!`);
      }
      
      // 🎯 Controlla duplicati
      if (usedColumns.includes(columnName)) {
        throw new Error(`❌ La colonna "${columnName}" è stata usata più di una volta. Ogni colonna può essere usata solo per un filtro.`);
      }
      usedColumns.push(columnName);
      
      filters[columnName] = {
        title: title,
        category: category,
        size: 500,
        conjunction: false,
        type: type
      };
    }
  });
  
  return filters;
}