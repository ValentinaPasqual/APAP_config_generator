// main.js
import { startFromScratch, nextStep, prevStep, goToStep } from "./src/navigationManager.js";
import { handleFileUpload as handleFileUploadStep2, addSeparatorRow } from "./src/steps/step2Manager.js";
import { handleFileUpload as handleFileUploadStep3, handleMultipleFiles, toggleOptional } from "./src/steps/step3Manager.js";
import { addFilterRow } from "./src/steps/step5Manager.js";
import { 
  addSortingRow, 
  addModalInfoRow, 
  checkFirstSortingRow, 
  populateResultCardsFields 
} from "./src/steps/step6Manager.js";
import { loadExistingZip } from "./src/zipLoader.js";
import { generateZip } from "./src/zipBuilder.js";

// Unified file upload handler
function handleFileUpload(type, file) {
  if (type === 'locations' || type === 'references') {
    handleFileUploadStep2(type, file);
  } else {
    handleFileUploadStep3(type, file);
  }
}

// Make functions available globally
window.uiManager = {
  addSeparatorRow,
  addFilterRow,
  addSortingRow,
  addModalInfoRow,
  checkFirstSortingRow,
  populateResultCardsFields,
  nextStep,
  prevStep,
  goToStep,
  startFromScratch,
  handleMultipleFiles,
  toggleOptional
};

window.loadExistingZip = loadExistingZip;
window.generateZip = generateZip;
window.handleFileUpload = handleFileUpload;