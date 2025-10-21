// zipLoader.js
import { ZipWriter, ZipReader, BlobWriter, BlobReader, TextReader, TextWriter } from '@zip.js/zip.js';
import { setFile, setMultipleFiles, projectData } from './dataStore.js';
// import { handleMultipleFiles, toggleOptional } from './uiManager.js';

export async function loadExistingZip(file) {
  if (!file) return;

  const loadingEl = document.getElementById('loadingZip');
  if (loadingEl) loadingEl.classList.add('active');

  try {
    const zipReader = new ZipReader(new BlobReader(file));
    const entries = await zipReader.getEntries();

    console.log('📦 Entries trovate nello ZIP:', entries.map(e => e.filename));

    // 1️⃣ CARICA CONFIG.JSON e salvalo TUTTO in projectData
    const configEntry = entries.find(e => 
      e.filename === 'public/config/map-config.json'
    );
    
    if (configEntry) {
      const configText = await configEntry.getData(new TextWriter());
      const config = JSON.parse(configText);
      
      console.log('📋 Config caricato:', config);
      
      // 🎯 SALVA TUTTO IL CONFIG IN projectData
      projectData.config = config;
      
      console.log('✅ Config completo salvato in projectData.config');
    } else {
      console.warn('⚠️ Config non trovato nello ZIP');
    }

    // 2️⃣ CARICA locations.tsv e ESTRAI HEADERS
    const locationsEntry = entries.find(e => e.filename === 'public/data/locations.tsv');
    if (locationsEntry) {
      const blob = await locationsEntry.getData(new BlobWriter());
      const f = new File([blob], 'locations.tsv', { type: 'text/tab-separated-values' });
      setFile('locations', f);
      
      // 🎯 ESTRAI HEADERS CON DEBUG COMPLETO
      const text = await f.text();
      
      console.log('📄 LOCATIONS - PRIMI 300 CARATTERI:', text.substring(0, 300));
      console.log('📏 LOCATIONS - Lunghezza totale file:', text.length);
      
      // Prova a pulire eventuali BOM
      const cleanText = text.replace(/^\uFEFF/, '');
      
      const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
      console.log('📊 LOCATIONS - Righe non vuote:', lines.length);
      console.log('📋 LOCATIONS - Prima riga:', lines[0]);
      console.log('📋 LOCATIONS - Seconda riga:', lines[1]);
      
      const firstLine = lines[0];
      const headers = firstLine.split('\t').map(h => h.trim());
      projectData.locationsHeaders = headers;
      
      console.log('✅ locations.tsv caricato con headers:', projectData.locationsHeaders);
    } else {
      console.warn('⚠️ locations.tsv non trovato');
    }

    // 3️⃣ CARICA references.tsv e ESTRAI HEADERS
    const referencesEntry = entries.find(e => e.filename === 'public/data/references.tsv');
    if (referencesEntry) {
      const blob = await referencesEntry.getData(new BlobWriter());
      const f = new File([blob], 'references.tsv', { type: 'text/tab-separated-values' });
      setFile('references', f);
      
      // 🎯 ESTRAI HEADERS CON DEBUG COMPLETO
      const text = await f.text();
      
      console.log('📄 PRIMI 300 CARATTERI:', text.substring(0, 300));
      console.log('📏 Lunghezza totale file:', text.length);
      
      // Prova a pulire eventuali BOM
      const cleanText = text.replace(/^\uFEFF/, '');
      
      const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
      console.log('📊 Righe non vuote:', lines.length);
      console.log('📋 Prima riga:', lines[0]);
      console.log('📋 Seconda riga:', lines[1]);
      
      const firstLine = lines[0];
      const headers = firstLine.split('\t').map(h => h.trim());
      projectData.referencesHeaders = headers;
      
      console.log('✅ references.tsv caricato con headers:', projectData.referencesHeaders);
    } else {
      console.warn('⚠️ references.tsv non trovato');
    }

    // 4️⃣ CARICA logo
    const logoEntry = entries.find(e => 
      e.filename.startsWith('public/imgs/project_logo.') && 
      !e.directory
    );

    if (logoEntry) {
      const blob = await logoEntry.getData(new BlobWriter());
      const ext = logoEntry.filename.split('.').pop();
      const fileLogo = new File([blob], `project_logo.${ext}`, { type: `image/${ext}` });
      setFile('logo', fileLogo);
      console.log('✅ Logo caricato:', fileLogo.name);
    } else {
      console.warn('⚠️ Logo non trovato');
    }

    // 5️⃣ CARICA file istituzionali
    const institutionalEntries = entries.filter(e => 
      e.filename.startsWith('public/imgs/institutional_logos/') && 
      !e.directory &&
      e.filename !== 'public/imgs/institutional_logos/'
    );
    
    if (institutionalEntries.length > 0) {
      const instFiles = [];
      for (let entry of institutionalEntries) {
        const blob = await entry.getData(new BlobWriter());
        const filename = entry.filename.split('/').pop();
        const file = new File([blob], filename);
        instFiles.push(file);
      }
      
      setMultipleFiles('institutional', instFiles);
      console.log('✅ File istituzionali caricati:', instFiles.length);
    } else {
      console.log('ℹ️ Nessun file istituzionale trovato');
    }

    // 6️⃣ CARICA tailwind.config.js
    const tailwindEntry = entries.find(e => e.filename === 'tailwind.config.js');
    if (tailwindEntry) {
      const blob = await tailwindEntry.getData(new BlobWriter());
      const tailwindFile = new File([blob], 'tailwind.config.js', { type: 'text/javascript' });
      setFile('tailwind', tailwindFile);
      console.log('✅ tailwind.config.js caricato');
    } else {
      console.warn('⚠️ tailwind.config.js non trovato');
    }

    await zipReader.close();
    
    if (loadingEl) loadingEl.classList.remove('active');
    
    alert('✅ ZIP caricato con successo! Puoi ora modificare i campi.');
    
    // Vai al passo 1 dove il form verrà popolato
    const { goToStep } = await import('./navigationManager.js');
    goToStep(1);

  } catch (error) {
    console.error('❌ Errore nel caricamento dello ZIP:', error);
    alert('❌ Errore nel caricamento del file ZIP: ' + (error.message || error));
    const loadingEl = document.getElementById('loadingZip');
    if (loadingEl) loadingEl.classList.remove('active');
  }
}