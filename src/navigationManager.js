// navigationManager.js - Gestione navigazione tra gli step
import { validateStep1, populateStep1Form } from './steps/step1Manager.js';
import { validateStep2, populateStep2Form } from './steps/step2Manager.js';
import { validateStep3, populateStep3Form } from './steps/step3Manager.js';
import { validateStep4, populateStep4Form } from './steps/step4Manager.js';
import { validateStep5, populateStep5Form } from './steps/step5Manager.js';
import { validateStep6, populateStep6Form } from './steps/step6Manager.js';
import { validateStep7, populateStep7Form, initializeStep7 } from './steps/step7Manager.js';
import { validateStep8, updateSummary, initializeDownloadButton } from './steps/step8Manager.js';
import { projectData } from './dataStore.js';

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

  // 🎯 Popola il form dello step corrente
  setTimeout(() => {
    populateCurrentStep(stepNumber);
  }, 0);
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

  // 🎯 Popola il form del nuovo step
  setTimeout(() => {
    populateCurrentStep(current);
  }, 0);

  // Quando arriviamo allo step 7 (riepilogo), aggiorna il summary e inizializza il download
  if (current === 8) {
    updateSummary();
    initializeDownloadButton();
  }
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

  // 🎯 Popola il form dello step precedente
  setTimeout(() => {
    populateCurrentStep(target);
  }, 0);
}

// 🎯 NUOVA FUNZIONE: Popola lo step corrente in base ai dati caricati
function populateCurrentStep(stepNumber) {
  switch(stepNumber) {
    case 1:
      if (projectData.config) {
        populateStep1Form();
      }
      break;
    case 2:
      if (projectData.files.locations || projectData.files.references) {
        populateStep2Form();
      }
      break;
    case 3:
      if (projectData.files.locations || projectData.files.references) {
        populateStep3Form();
      }
      break;
    case 4:
      if (projectData.files.locations || projectData.files.references) {
        populateStep4Form();
      }
      break;
    case 5:
      if (projectData.files.locations || projectData.files.references) {
        populateStep5Form();
      }
      break;
    case 6:
      if (projectData.files.locations || projectData.files.references) {
        populateStep6Form();
      }
      break;
    case 7:
      initializeStep7();
      if (projectData.files.locations || projectData.files.references) {
        populateStep7Form();
      }
      break;
    // Aggiungi qui altri step se necessario
    default:
    break;
  }
}

export function validateStep(step) {
  switch(step) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    case 4:
      return validateStep4();
    case 5:
      return validateStep5();
    case 6:
      return validateStep6();
    case 7:
      return validateStep7();
    case 8:
      return validateStep8();
    default:
      return true;
  }
}