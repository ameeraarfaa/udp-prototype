// Main entry point for the modular JS app
import { map, locations, initMap } from './map-init.js';
import { buildSidebar } from './sidebar.js';
import { loadLayersFromConfig } from './layer-controls.js';
import { exportVisibleMap } from './export.js';

async function initializeApp() {
  await loadLayersFromConfig();
  fetch('static/data/locations.json')
    .then(res => res.json())
    .then(data => {
      locations.length = 0;
      locations.push(...data);
      initMap();
      buildSidebar();
      document.getElementById('download-map').addEventListener('click', exportVisibleMap);
    })
    .catch(err => {
      console.error('Error loading locations.json:', err);
      alert('Failed to load locations. Please check console.');
    });
}

initializeApp();
