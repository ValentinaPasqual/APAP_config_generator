// zipBuilder.js - Versione pulita e semplice
import { ZipWriter, BlobWriter, BlobReader, TextReader } from '@zip.js/zip.js';

export async function generateZip(projectData) {
  console.log('🚀 Inizio generazione ZIP');
  
  try {
    // Crea lo zip writer
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

    // Aggiungi i file TSV
    if (projectData.files?.locations) {
      await zipWriter.add('public/data/locations.tsv', new BlobReader(projectData.files.locations));
      console.log('✅ Aggiunto locations.tsv');
    }
    
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
    const config = {
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
    
    await zipWriter.add('public/config/map-config.json', new TextReader(JSON.stringify(config, null, 2)));
    console.log('✅ Aggiunto config.json');
    
    // README
    const readme = `# ${projectData.projectTitle || 'Progetto'}

Questo pacchetto contiene tutti i file necessari per il progetto.

## Contenuto
- public/data/ - File TSV con dati
- public/imgs/ - Logo e immagini istituzionali
- public/config/ - Configurazione del progetto

## Installazione
Estrai questo ZIP nella cartella del progetto principale.
`;
    
    await zipWriter.add('README.md', new TextReader(readme));
    console.log('✅ Aggiunto README');

    // Chiudi e scarica
    const blob = await zipWriter.close();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.projectShortTitle || "project"}_bundle.zip`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ ZIP scaricato!');
    return true;
    
  } catch (error) {
    console.error('❌ Errore generazione ZIP:', error);
    throw error;
  }
}