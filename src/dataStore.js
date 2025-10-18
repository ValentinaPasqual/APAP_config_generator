// dataStore.js


export const projectData = { files: {}, locationsHeaders: [], referencesHeaders: [] };

export function setFile(type, file) {
  projectData.files[type] = file;
}

export function setMultipleFiles(type, files) {
  projectData.files[type] = Array.from(files);
}

export function removeFileByIndex(type, index) {
  if (!projectData.files[type]) return;
  projectData.files[type].splice(index, 1);
}

export function getFile(type) {
  return projectData.files[type] || null;
}

export function getMultiple(type) {
  return projectData.files[type] || [];
}