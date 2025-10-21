// steps/step7Manager.js -- style
import { projectData } from '../dataStore.js';

// Font disponibili
export const AVAILABLE_FONTS = [
  { name: 'Inter', family: 'Inter, ui-sans-serif, system-ui', description: 'Moderno e leggibile', type: 'sans-serif' },
  { name: 'Poppins', family: 'Poppins, ui-sans-serif, system-ui', description: 'Geometrico e trendy', type: 'sans-serif' },
  { name: 'Playfair Display', family: 'Playfair Display, ui-serif, Georgia', description: 'Elegante per titoli', type: 'serif' },
  { name: 'Merriweather', family: 'Merriweather, ui-serif, Georgia', description: 'Perfetto per testo lungo', type: 'serif' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono, ui-monospace, SFMono-Regular', description: 'Miglior monospace', type: 'monospace' },
  { name: 'Montserrat', family: 'Montserrat, ui-sans-serif, system-ui', description: 'Bold per headlines', type: 'sans-serif' },
  { name: 'Roboto', family: 'Roboto, ui-sans-serif, system-ui', description: 'Classico Google', type: 'sans-serif' },
  { name: 'Lato', family: 'Lato, ui-sans-serif, system-ui', description: 'Friendly e professionale', type: 'sans-serif' },
];

// Genera palette colori da un hex
function generateColorPalette(baseHex) {
  const hex = baseHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const hsl = rgbToHsl(r, g, b);
  
  return {
    50: hslToHex(hsl.h, hsl.s * 0.6, Math.min(hsl.l + 45, 95)),
    100: hslToHex(hsl.h, hsl.s * 0.7, Math.min(hsl.l + 38, 90)),
    200: hslToHex(hsl.h, hsl.s * 0.8, Math.min(hsl.l + 28, 82)),
    300: hslToHex(hsl.h, hsl.s * 0.9, Math.min(hsl.l + 18, 70)),
    400: hslToHex(hsl.h, hsl.s * 0.95, Math.min(hsl.l + 8, 58)),
    500: hslToHex(hsl.h, hsl.s, hsl.l),
    600: hslToHex(hsl.h, hsl.s * 1.05, Math.max(hsl.l - 8, 35)),
    700: baseHex,
    800: hslToHex(hsl.h, hsl.s * 1.1, Math.max(hsl.l - 18, 25)),
    900: hslToHex(hsl.h, hsl.s * 1.15, Math.max(hsl.l - 25, 15)),
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (val) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Inizializza lo step theme
export function initializeStep7() {
  console.log('🎨 Inizializzazione Step 7');
  
  // Valori di default
  if (!projectData.theme) {
    projectData.theme = {
      primaryColor: '#1C6F3A',
      secondaryColor: '#C24C1C',
      accentColor: '#91C682',
      headingsFont: 'Playfair Display',
      bodyFont: 'Inter'
    };
  }

  // 🔍 VERIFICA che gli elementi esistano
  const primaryColorEl = document.getElementById('primaryColor');
  const headingsFontEl = document.getElementById('headingsFont');
  const bodyFontEl = document.getElementById('bodyFont');
  
  if (!primaryColorEl || !headingsFontEl || !bodyFontEl) {
    console.error('❌ Elementi dello step 7 non trovati!');
    return;
  }

  // Popola i color pickers
  primaryColorEl.value = projectData.theme.primaryColor;
  document.getElementById('secondaryColor').value = projectData.theme.secondaryColor;
  document.getElementById('accentColor').value = projectData.theme.accentColor;

  // 🎯 POPOLA I SELETTORI FONT PRIMA DI IMPOSTARE I VALORI
  populateFontSelectors();
  
  // POI imposta i valori
  headingsFontEl.value = projectData.theme.headingsFont;
  bodyFontEl.value = projectData.theme.bodyFont;

  console.log('✅ Dropdown font popolati con:', AVAILABLE_FONTS.length, 'opzioni');

  // Genera le preview iniziali
  updateColorPalette('primary', projectData.theme.primaryColor);
  updateColorPalette('secondary', projectData.theme.secondaryColor);
  updateColorPalette('accent', projectData.theme.accentColor);
  updateFontPreview('headings', projectData.theme.headingsFont);
  updateFontPreview('body', projectData.theme.bodyFont);
  updateFullPreview();

  // Aggiungi event listeners
  document.getElementById('primaryColor').addEventListener('input', (e) => {
    updateColorPalette('primary', e.target.value);
    updateFullPreview();
  });

  document.getElementById('secondaryColor').addEventListener('input', (e) => {
    updateColorPalette('secondary', e.target.value);
    updateFullPreview();
  });

  document.getElementById('accentColor').addEventListener('input', (e) => {
    updateColorPalette('accent', e.target.value);
    updateFullPreview();
  });

  document.getElementById('headingsFont').addEventListener('change', (e) => {
    updateFontPreview('headings', e.target.value);
    updateFullPreview();
  });

  document.getElementById('bodyFont').addEventListener('change', (e) => {
    updateFontPreview('body', e.target.value);
    updateFullPreview();
  });
}

// Popola i selettori font
function populateFontSelectors() {
  const headingsSelect = document.getElementById('headingsFont');
  const bodySelect = document.getElementById('bodyFont');

  AVAILABLE_FONTS.forEach(font => {
    const option = document.createElement('option');
    option.value = font.name;
    option.textContent = `${font.name} - ${font.description}`;
    headingsSelect.appendChild(option.cloneNode(true));
    bodySelect.appendChild(option);
  });
}

// Aggiorna la preview della palette colori
function updateColorPalette(type, color) {
  const palette = generateColorPalette(color);
  const container = document.getElementById(`${type}Palette`);
  
  container.innerHTML = Object.entries(palette).map(([shade, hexColor]) => `
    <div class="text-center">
      <div 
        style="background-color: ${hexColor}; width: 100%; height: 40px; border-radius: 4px; border: 1px solid #ddd;"
        title="${shade}: ${hexColor}"
      ></div>
      <span style="font-size: 12px; color: #666;">${shade}</span>
    </div>
  `).join('');

  // 🔴 CORREGGI: controlla PRIMA se theme esiste
  if (!projectData.theme) {
    projectData.theme = {};
  }
  
  // POI salva i valori
  projectData.theme[`${type}Color`] = color;
  projectData.theme[`${type}Palette`] = palette;
}

// Aggiorna preview font
function updateFontPreview(type, fontName) {
  const font = AVAILABLE_FONTS.find(f => f.name === fontName);
  const preview = document.getElementById(`${type}FontPreview`);
  
  if (font && preview) {
    preview.style.fontFamily = font.family;
  }

  // 🔴 CORREGGI: controlla PRIMA se theme esiste
  if (!projectData.theme) {
    projectData.theme = {};
  }
  
  projectData.theme[`${type}Font`] = fontName;
}

// Aggiorna preview completa
function updateFullPreview() {
  const preview = document.getElementById('fullThemePreview');
  const headingsFont = AVAILABLE_FONTS.find(f => f.name === projectData.theme.headingsFont);
  const bodyFont = AVAILABLE_FONTS.find(f => f.name === projectData.theme.bodyFont);

  preview.innerHTML = `
    <!-- Header -->
    <div style="background-color: ${projectData.theme.primaryColor}; padding: 24px; color: white;">
      <h1 style="font-family: ${headingsFont.family}; font-size: 32px; font-weight: bold; margin-bottom: 8px;">
        Titolo del Progetto
      </h1>
      <p style="font-family: ${bodyFont.family}; opacity: 0.9;">
        Questo è un esempio di come apparirà il tuo progetto
      </p>
    </div>
    
    <!-- Content -->
    <div style="background-color: white; padding: 24px;">
      <h2 style="font-family: ${headingsFont.family}; color: ${projectData.theme.primaryColor}; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
        Sezione Principale
      </h2>
      <p style="font-family: ${bodyFont.family}; margin-bottom: 16px;">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      
      <div style="display: flex; gap: 12px;">
        <button style="background-color: ${projectData.theme.primaryColor}; color: white; padding: 8px 24px; border-radius: 4px; border: none; font-weight: 600; cursor: pointer;">
          Primary Button
        </button>
        <button style="background-color: ${projectData.theme.secondaryColor}; color: white; padding: 8px 24px; border-radius: 4px; border: none; font-weight: 600; cursor: pointer;">
          Secondary Button
        </button>
        <button style="color: ${projectData.theme.accentColor}; border: 2px solid ${projectData.theme.accentColor}; background: white; padding: 8px 24px; border-radius: 4px; font-weight: 600; cursor: pointer;">
          Accent Button
        </button>
      </div>
    </div>
  `;
}

// Valida lo step
export function validateStep7() {
  if (!projectData.theme?.primaryColor) {
    alert('Seleziona un colore primario');
    return false;
  }
  if (!projectData.theme?.secondaryColor) {
    alert('Seleziona un colore secondario');
    return false;
  }
  if (!projectData.theme?.accentColor) {
    alert('Seleziona un colore accent');
    return false;
  }
  if (!projectData.theme?.headingsFont) {
    alert('Seleziona un font per i titoli');
    return false;
  }
  if (!projectData.theme?.bodyFont) {
    alert('Seleziona un font per il testo');
    return false;
  }

  console.log('✅ Tema configurato:', projectData.theme);
  return true;
}

// Popola il form quando si carica uno ZIP esistente
export function populateStep7Form() {
  const tailwindFile = projectData.files?.tailwind;
  
  if (tailwindFile) {
    console.log('📄 Caricamento tema da tailwind.config.js');
    
    // Leggi il contenuto del file tailwind.config.js
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      
      console.log('📄 Contenuto tailwind.config.js (primi 500 char):', content.substring(0, 500));
      
      // Estrai i colori principali cercando i commenti "Main primary", etc.
      const primaryMatch = content.match(/900:\s*'([^']+)',\s*\/\/\s*Main primary/);
      const secondaryMatch = content.match(/900:\s*'([^']+)',\s*\/\/\s*Main secondary/);
      const accentMatch = content.match(/500:\s*'([^']+)',\s*\/\/\s*Main accent/);
      
      // Estrai i font
      const headingsMatch = content.match(/'headings':\s*\['([^']+)'/);
      const bodyMatch = content.match(/'body':\s*\['([^']+)'/);
      
      console.log('🎨 Colori estratti:', { 
        primary: primaryMatch?.[1], 
        secondary: secondaryMatch?.[1], 
        accent: accentMatch?.[1] 
      });
      console.log('🔤 Font estratti:', { 
        headings: headingsMatch?.[1], 
        body: bodyMatch?.[1] 
      });
      
      // Aggiorna projectData.theme con i valori estratti
      if (primaryMatch) {
        projectData.theme.primaryColor = primaryMatch[1];
        document.getElementById('primaryColor').value = primaryMatch[1];
        updateColorPalette('primary', primaryMatch[1]);
      }
      
      if (secondaryMatch) {
        projectData.theme.secondaryColor = secondaryMatch[1];
        document.getElementById('secondaryColor').value = secondaryMatch[1];
        updateColorPalette('secondary', secondaryMatch[1]);
      }
      
      if (accentMatch) {
        projectData.theme.accentColor = accentMatch[1];
        document.getElementById('accentColor').value = accentMatch[1];
        updateColorPalette('accent', accentMatch[1]);
      }
      
      if (headingsMatch) {
        projectData.theme.headingsFont = headingsMatch[1];
        document.getElementById('headingsFont').value = headingsMatch[1];
        updateFontPreview('headings', headingsMatch[1]);
      }
      
      if (bodyMatch) {
        projectData.theme.bodyFont = bodyMatch[1];
        document.getElementById('bodyFont').value = bodyMatch[1];
        updateFontPreview('body', bodyMatch[1]);
      }
      
      updateFullPreview();
      
      console.log('✅ Tema caricato da tailwind.config.js:', projectData.theme);
    };
    
    reader.readAsText(tailwindFile);
  } else {
    console.log('ℹ️ Nessun file tailwind.config.js trovato, uso valori di default');
  }
}