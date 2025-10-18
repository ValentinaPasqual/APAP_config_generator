// step4Manager.js - Step 4: Configurazione Mappa
import { projectData } from '../dataStore.js';

export function validateStep4() {
  const lat = document.getElementById('latitude')?.value;
  const lon = document.getElementById('longitude')?.value;
  const zoom = document.getElementById('zoom')?.value;
  
  if (!lat || !lon || !zoom) {
    alert('Completa la configurazione della mappa!');
    return false;
  }
  
  // 🎯 Salva i dati correnti
  saveStep4Data();
  
  return true;
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

export function getMapConfig() {
  return {
    latitude: parseFloat(document.getElementById('latitude')?.value) || 41.8719,
    longitude: parseFloat(document.getElementById('longitude')?.value) || 12.5674,
    zoom: parseInt(document.getElementById('zoom')?.value) || 6,
    tileLayers: getTileLayers()
  };
}

// 🎯 NUOVA FUNZIONE: Popola lo step 4 quando ci arrivi
export function populateStep4Form() {
  if (!projectData.config?.map) {
    console.log('ℹ️ Nessuna configurazione mappa da caricare');
    return;
  }
  
  console.log('🎨 Popolamento step 4 (configurazione mappa)');
  
  const mapConfig = projectData.config.map;
  
  // 1️⃣ Popola coordinate e zoom
  const latEl = document.getElementById('latitude');
  const lonEl = document.getElementById('longitude');
  const zoomEl = document.getElementById('zoom');
  
  if (latEl && mapConfig.latitude !== undefined) {
    latEl.value = mapConfig.latitude;
    console.log('✅ Latitude popolata:', mapConfig.latitude);
  }
  
  if (lonEl && mapConfig.longitude !== undefined) {
    lonEl.value = mapConfig.longitude;
    console.log('✅ Longitude popolata:', mapConfig.longitude);
  }
  
  if (zoomEl && mapConfig.zoom !== undefined) {
    zoomEl.value = mapConfig.zoom;
    console.log('✅ Zoom popolato:', mapConfig.zoom);
  }
  
  // 2️⃣ Popola tileLayers (checkboxes)
  if (mapConfig.tileLayers) {
    const tileLayers = mapConfig.tileLayers;
    
    // Controlla se c'è il layer Terrain
    if (tileLayers.Terrain) {
      const terrainCheckbox = document.getElementById('enableTerrain');
      if (terrainCheckbox) {
        terrainCheckbox.checked = true;
        console.log('✅ Terrain layer abilitato');
      }
    }
    
    // Controlla se c'è il layer CartoDB
    if (tileLayers.CartoDB_Positron) {
      const cartoDBCheckbox = document.getElementById('enableCartoDB');
      if (cartoDBCheckbox) {
        cartoDBCheckbox.checked = true;
        console.log('✅ CartoDB layer abilitato');
      }
    }
  }
  
  console.log('✅ Step 4 completamente popolato');
}

// 🎯 NUOVA FUNZIONE: Salva i dati correnti in projectData
function saveStep4Data() {
  const lat = document.getElementById('latitude')?.value;
  const lon = document.getElementById('longitude')?.value;
  const zoom = document.getElementById('zoom')?.value;
  
  if (!projectData.config) {
    projectData.config = {};
  }
  
  if (!projectData.config.map) {
    projectData.config.map = {};
  }
  
  if (lat) projectData.config.map.latitude = parseFloat(lat);
  if (lon) projectData.config.map.longitude = parseFloat(lon);
  if (zoom) projectData.config.map.zoom = parseInt(zoom);
  
  projectData.config.map.tileLayers = getTileLayers();
  
  console.log('💾 Dati step 4 salvati in projectData.config.map');
}