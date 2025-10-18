// step1Manager.js - Step 1: Info Base
import { projectData } from '../dataStore.js';

export function validateStep1() {
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
  
  // 🎯 Salva i valori correnti in projectData
  saveStep1Data();
  
  return true;
}

export function getStep1Data() {
  return {
    shortTitle: document.getElementById('shortTitle')?.value || '',
    projectTitle: document.getElementById('projectTitle')?.value || '',
    subtitle: document.getElementById('projectSubtitle')?.value || '',
    description: document.getElementById('projectDescription')?.value || ''
  };
}

// 🎯 NUOVA FUNZIONE: Popola il form dallo ZIP caricato
export function populateStep1Form() {
  // Se non c'è config, non fare nulla
  if (!projectData.config) {
    console.log('ℹ️ Nessun config da caricare nello step 1');
    return;
  }
  
  console.log('🎨 Popolamento form step 1 da projectData.config');
  
  const config = projectData.config;
  
  // Popola campi PROJECT
  if (config.project) {
    const mappings = {
      'shortTitle': config.project.projectShortTitle,
      'projectTitle': config.project.projectTitle,
      'projectSubtitle': config.project.projectSubtitle,
      'projectDescription': config.project.projectDescription
    };
    
    for (const [fieldId, value] of Object.entries(mappings)) {
      const el = document.getElementById(fieldId);
      if (el && value !== undefined && value !== null) {
        el.value = value;
        console.log(`✅ ${fieldId} popolato:`, value);
      }
    }
  }
  
  // Popola coordinate MAP (se sono nello step 1)
  if (config.map) {
    const latEl = document.getElementById('latitude');
    const lonEl = document.getElementById('longitude');
    
    if (latEl && config.map.latitude !== undefined) {
      latEl.value = config.map.latitude;
      console.log('✅ Latitude popolata:', config.map.latitude);
    }
    
    if (lonEl && config.map.longitude !== undefined) {
      lonEl.value = config.map.longitude;
      console.log('✅ Longitude popolata:', config.map.longitude);
    }
  }
  
  console.log('✅ Form step 1 completamente popolato');
}

// 🎯 NUOVA FUNZIONE: Salva i dati correnti del form in projectData
function saveStep1Data() {
  const shortTitle = document.getElementById('shortTitle')?.value;
  const projectTitle = document.getElementById('projectTitle')?.value;
  const projectSubtitle = document.getElementById('projectSubtitle')?.value;
  const projectDescription = document.getElementById('projectDescription')?.value;
  const latitude = document.getElementById('latitude')?.value;
  const longitude = document.getElementById('longitude')?.value;
  
  if (shortTitle) projectData.projectShortTitle = shortTitle;
  if (projectTitle) projectData.projectTitle = projectTitle;
  if (projectSubtitle) projectData.projectSubtitle = projectSubtitle;
  if (projectDescription) projectData.projectDescription = projectDescription;
  if (latitude) projectData.latitude = parseFloat(latitude);
  if (longitude) projectData.longitude = parseFloat(longitude);
  
  console.log('💾 Dati step 1 salvati in projectData');
}