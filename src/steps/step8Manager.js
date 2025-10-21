// step8Manager.js - Step 8: Riepilogo e Download
import { ZipWriter, BlobWriter, BlobReader, TextReader } from '@zip.js/zip.js';
import { projectData } from '../dataStore.js';

export function validateStep8() {
  return true;
}

export function updateSummary() {
  const shortTitle = document.getElementById('shortTitle')?.value || '';
  const projectTitle = document.getElementById('projectTitle')?.value || '';
  
  const sumShortTitle = document.getElementById('sum-shortTitle');
  const sumProjectTitle = document.getElementById('sum-projectTitle');
  
  if (sumShortTitle) sumShortTitle.textContent = shortTitle;
  if (sumProjectTitle) sumProjectTitle.textContent = projectTitle;

  const latEl = document.getElementById('latitude');
  const lonEl = document.getElementById('longitude');
  const sumCoords = document.getElementById('sum-coords');
  
  if (sumCoords) {
    if (latEl && lonEl) {
      sumCoords.textContent = `${latEl.value}, ${lonEl.value}`;
    } else {
      sumCoords.textContent = 'Non specificato';
    }
  }

  const sumLocations = document.getElementById('sum-locations');
  const sumReferences = document.getElementById('sum-references');
  const sumLogo = document.getElementById('sum-logo');
  const sumInstitutional = document.getElementById('sum-institutional');
  
  if (sumLocations) {
    sumLocations.textContent = projectData.files.locations 
      ? '✓ ' + projectData.files.locations.name 
      : '✗';
  }
  
  if (sumReferences) {
    sumReferences.textContent = projectData.files.references 
      ? '✓ ' + projectData.files.references.name 
      : '✗';
  }
  
  if (sumLogo) {
    sumLogo.textContent = projectData.files.logo 
      ? '✓ ' + projectData.files.logo.name 
      : '✗';
  }
  
  const inst = projectData.files.institutional ? projectData.files.institutional.length : 0;
  if (sumInstitutional) {
    sumInstitutional.textContent = inst > 0 ? `✓ ${inst} file` : 'Nessuno';
  }
}

export function initializeDownloadButton() {
  const downloadBtn = document.getElementById('downloadZip');
  
  if (!downloadBtn) {
    console.error('Download button not found');
    return;
  }
  
  const newBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
  
  newBtn.addEventListener('click', async () => {
    newBtn.disabled = true;
    newBtn.textContent = '⏳ Generazione ZIP...';
    
    try {
      await generateZip();
      newBtn.textContent = '✅ Completato!';
      setTimeout(() => {
        newBtn.disabled = false;
        newBtn.textContent = 'Scarica ZIP';
      }, 2000);
    } catch (error) {
      console.error('Errore durante la generazione dello ZIP:', error);
      alert('Errore durante la generazione del file ZIP: ' + error.message);
      newBtn.disabled = false;
      newBtn.textContent = 'Scarica ZIP';
    }
  });
}

// 🎯 Genera lo ZIP completo
async function generateZip() {
  console.log('🚀 Inizio generazione ZIP');
  
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

  // Aggiungi locations.tsv
  if (projectData.files?.locations) {
    await zipWriter.add('public/data/locations.tsv', new BlobReader(projectData.files.locations));
    console.log('✅ Aggiunto locations.tsv');
  }
  
  // Aggiungi references.tsv
  if (projectData.files?.references) {
    await zipWriter.add('public/data/references.tsv', new BlobReader(projectData.files.references));
    console.log('✅ Aggiunto references.tsv');
  }

  // Aggiungi il logo
  let logoName = 'project_logo.png';
  if (projectData.files?.logo) {
    const ext = projectData.files.logo.name.split('.').pop();
    logoName = `project_logo.${ext}`;
    await zipWriter.add(`public/imgs/${logoName}`, new BlobReader(projectData.files.logo));
    console.log('✅ Aggiunto logo');
  }

  // Aggiungi file istituzionali
  if (projectData.files?.institutional?.length > 0) {
    for (const file of projectData.files.institutional) {
      await zipWriter.add(`public/imgs/institutional_logos/${file.name}`, new BlobReader(file));
    }
    console.log(`✅ Aggiunti ${projectData.files.institutional.length} file istituzionali`);
  }

  // Crea il config JSON
  const config = buildConfig(logoName);
  await zipWriter.add('public/config/map-config.json', new TextReader(JSON.stringify(config, null, 2)));
  console.log('✅ Aggiunto map-config.json');
  
  // Aggiungi README
  const readme = generateReadme();
  await zipWriter.add('README.md', new TextReader(readme));
  console.log('✅ Aggiunto README.md');

  // 🎨 GENERA E AGGIUNGI TAILWIND.CONFIG.JS
  const tailwindConfig = generateTailwindConfig(projectData.theme);
  await zipWriter.add('tailwind.config.js', new TextReader(tailwindConfig));
  console.log('✅ Aggiunto tailwind.config.js');

  // Chiudi e scarica
  const blob = await zipWriter.close();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectData.projectShortTitle || "project"}_bundle.zip`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('✅ ZIP scaricato!');
}

// 🎯 Costruisce il config completo
function buildConfig(logoName) {
  return {
    project: {
      projectShortTitle: projectData.projectShortTitle || '',
      projectThumbnailURL: logoName,
      projectTitle: projectData.projectTitle || '',
      projectSubtitle: projectData.projectSubtitle || '',
      projectDescription: projectData.projectDescription || '',
      mapInfoTitle: projectData.mapInfoTitle || 'Scopri la mappa',
      mapInfoDescription: projectData.mapInfoDescription || ''
    },
    
    datasetConfig: {
      multivalue_rows: projectData.multivalueSeparators || {}
    },
    
    map: {
      initialView: [
        projectData.latitude || 0,
        projectData.longitude || 0
      ],
      initialZoom: projectData.initialZoom || 6,
      tileLayers: {
        "Default": {
          "tileLayer": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "attribution": "© OpenStreetMap contributors"
        }
      }
    },
    
    result_cards: projectData.referencesConfig?.result_cards || {},
    modal_information: projectData.referencesConfig?.modal_information || {},
    searchConfig: projectData.referencesConfig?.searchConfig || {
      debounceTime: 300,
      defaultSort: "title_asc",
      sortOptions: []
    },
    resultsDisplay: projectData.referencesConfig?.resultsDisplay || {
      tagsToShow: []
    },
    sortings: projectData.referencesConfig?.sortings || {},
    searchableFields: projectData.referencesConfig?.searchableFields || [],
    aggregations: projectData.filters || {},
    
    map_popups: {
      show_polygons: "True",
      show_related_pins: "True"
    }
  };
}

// 🎨 Genera il file tailwind.config.js completo
function generateTailwindConfig(theme) {
  const primaryPalette = theme?.primaryPalette || {};
  const secondaryPalette = theme?.secondaryPalette || {};
  const accentPalette = theme?.accentPalette || {};
  
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
    './*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY COLOR
        primary: ${JSON.stringify(primaryPalette, null, 8).replace(/^/gm, '        ').trim()},
        
        // SECONDARY COLOR
        secondary: ${JSON.stringify(secondaryPalette, null, 8).replace(/^/gm, '        ').trim()},
        
        // ACCENT COLOR
        accent: ${JSON.stringify(accentPalette, null, 8).replace(/^/gm, '        ').trim()}
      },
      
      // CUSTOM FONTS
      fontFamily: {
        'headings': ['${theme?.headingsFont || 'Playfair Display'}', 'ui-serif', 'Georgia'],
        'body': ['${theme?.bodyFont || 'Inter'}', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};`;
}

// 📝 Genera il README
function generateReadme() {
  return `# ${projectData.projectTitle || 'Progetto'}

${projectData.projectDescription || 'Questo pacchetto contiene tutti i file necessari per il progetto.'}

## 📦 Contenuto dello ZIP

\`\`\`
project_bundle.zip/
├── README.md
└── public/
    ├── data/
    │   ├── locations.tsv
    │   └── references.tsv
    ├── imgs/
    │   ├── project_logo.${projectData.files?.logo?.name.split('.').pop() || 'png'}
    │   └── institutional_logo/
    │       └── [file istituzionali]
    └── config/
    │   └── map-config.json
    └── tailwind.config.json
\`\`\`

## 🚀 Installazione

1. Estrai questo ZIP nella cartella del progetto principale
2. I file verranno posizionati automaticamente nelle cartelle corrette
3. Verifica che tutti i percorsi siano corretti

## 📋 Configurazione

Il file \`map-config.json\` contiene tutta la configurazione del progetto:
- Informazioni base del progetto
- Coordinate iniziali della mappa
- Configurazione dei riferimenti
- Filtri e aggregazioni
- Separatori per campi multivalore

## 📧 Supporto

Per informazioni: ${projectData.projectShortTitle || 'progetto'}

---

Generato il ${new Date().toLocaleDateString('it-IT')}
`;
}