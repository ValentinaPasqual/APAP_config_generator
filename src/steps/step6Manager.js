// step6Manager.js - Step 6: Configurazione Riferimenti
import { projectData } from '../dataStore.js';

export function validateStep6() {
  try {
    const config = getReferencesConfig();
    
    // 🎯 Validazione 1: Titolo Card è obbligatorio
    if (!config.result_cards.card_title) {
      throw new Error('❌ Il campo "Titolo Card" è obbligatorio!');
    }
    
    // 🎯 Validazione 2: Almeno 1 ordinamento
    if (Object.keys(config.sortings).length === 0) {
      throw new Error('❌ Devi configurare almeno un ordinamento!');
    }
    
    // 🎯 Validazione 3: Almeno 1 elemento per references in modal_information
    const refHeaders = projectData.referencesHeaders || [];
    const hasRefInfo = refHeaders.some(header => config.modal_information[header]);
    
    if (!hasRefInfo) {
      throw new Error('❌ Devi includere almeno un campo da References nelle Informazioni Modal!');
    }
    
    // 🎯 Validazione 4: Almeno 1 elemento per locations in modal_information
    const locHeaders = projectData.locationsHeaders || [];
    const hasLocInfo = locHeaders.some(header => config.modal_information[header]);
    
    if (!hasLocInfo) {
      throw new Error('❌ Devi includere almeno un campo da Locations nelle Informazioni Modal!');
    }
    
    // 🎯 Salva la configurazione
    projectData.referencesConfig = config;
    console.log('💾 Configurazione riferimenti salvata:', projectData.referencesConfig);
    
    return true;
  } catch (error) {
    alert(error.message);
    return false;
  }
}

// Popola lo step 6 quando ci arrivi
export function populateStep6Form() {
  console.log('🎨 Popolamento step 6 (configurazione riferimenti)');
  
  // 1️⃣ Popola i dropdown con le colonne disponibili
  populateResultCardsFields();
  
  // 2️⃣ Il config è direttamente in projectData.config (non in un sotto-oggetto)
  if (projectData.config && (projectData.config.result_cards || projectData.config.sortings || projectData.config.modal_information)) {
    console.log('📋 Caricamento configurazione riferimenti dal config');
    // ⏰ Aspetta che i dropdown siano popolati prima di impostare i valori
    setTimeout(() => loadReferencesFromConfig(projectData.config), 100);
  } else {
    // 🎯 SE NON C'È CONFIG, CARICA TUTTI GLI HEADERS DISPONIBILI
    console.log('ℹ️ Nessuna configurazione riferimenti da caricare, uso tutti gli headers');
    populateModalInformation();
  }
  
  console.log('✅ Step 6 completamente popolato');
}

function loadReferencesFromConfig(config) {
  console.log('📋 Caricamento configurazione riferimenti:', config);
  
  // 1️⃣ Popola Result Cards
  if (config.result_cards) {
    const mappings = {
      cardTitle: config.result_cards.card_title,
      cardSubtitle: config.result_cards.card_subtitle,
      cardSubtitle2: config.result_cards.card_subtitle_2,
      cardDescription: config.result_cards.card_description,
      popupDescription: config.result_cards.popup_description
    };
    
    Object.entries(mappings).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element && value) {
        element.value = value;
        console.log(`✅ ${elementId} popolato:`, value);
      }
    });
  }
  
  // 2️⃣ Popola Sortings
  if (config.sortings && Object.keys(config.sortings).length > 0) {
    const sortingsList = document.getElementById('sortingsList');
    if (sortingsList) {
      sortingsList.innerHTML = '';
      
      const defaultSort = config.searchConfig?.defaultSort || '';
      let index = 0;
      
      Object.entries(config.sortings).forEach(([key, sortConfig]) => {
        addSortingRow();
        
        const rows = sortingsList.querySelectorAll('.sorting-row');
        const lastRow = rows[rows.length - 1];
        
        if (lastRow) {
          const fieldSelect = lastRow.querySelector('.sorting-field');
          const orderSelect = lastRow.querySelector('.sorting-order');
          const defaultRadio = lastRow.querySelector('.default-sort-radio');
          
          if (fieldSelect) fieldSelect.value = sortConfig.field;
          if (orderSelect) orderSelect.value = sortConfig.order;
          if (defaultRadio && key === defaultSort) defaultRadio.checked = true;
          
          console.log(`✅ Sorting ${index + 1} popolato:`, sortConfig.field, sortConfig.order, key === defaultSort ? '(default)' : '');
          index++;
        }
      });
      
      console.log(`✅ Totale sortings caricati: ${index}`);
    }
  }
  
  // 3️⃣ Popola Modal Information
  const modalInfoRefs = document.getElementById('modalInfoListRefs');
  const modalInfoLocs = document.getElementById('modalInfoListLocs');
  const refHeaders = projectData.referencesHeaders || [];
  const locHeaders = projectData.locationsHeaders || [];
  
  console.log('🔍 Headers disponibili:', { refHeaders, locHeaders });
  
  // 🎯 SE ESISTE modal_information NEL CONFIG, USA SOLO QUELLO
  if (config.modal_information && Object.keys(config.modal_information).length > 0) {
    console.log('📋 Caricamento modal_information dal config');
    
    if (modalInfoRefs) {
      modalInfoRefs.innerHTML = '';
      let refCount = 0;
      
      Object.entries(config.modal_information).forEach(([key, label]) => {
        // Solo campi che appartengono a references
        if (refHeaders.includes(key)) {
          addModalInfoRowPrefilled(key, label, 'modalInfoListRefs');
          console.log(`✅ Modal info (refs) popolato:`, key, '=', label);
          refCount++;
        }
      });
      
      console.log(`✅ Totale modal info refs: ${refCount}`);
    }
    
    if (modalInfoLocs) {
      modalInfoLocs.innerHTML = '';
      let locCount = 0;
      
      Object.entries(config.modal_information).forEach(([key, label]) => {
        // Solo campi che appartengono a locations
        if (locHeaders.includes(key)) {
          addModalInfoRowPrefilled(key, label, 'modalInfoListLocs');
          console.log(`✅ Modal info (locs) popolato:`, key, '=', label);
          locCount++;
        }
      });
      
      console.log(`✅ Totale modal info locs: ${locCount}`);
    }
  } else {
    // 🎯 SE NON ESISTE modal_information, CARICA TUTTI GLI HEADERS
    console.log('ℹ️ Nessun modal_information nel config, carico tutti gli headers');
    populateModalInformation();
  }
  
  console.log('✅ Configurazione riferimenti completamente caricata');
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