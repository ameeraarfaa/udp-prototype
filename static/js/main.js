import { initMap, getMap } from './map-init.js';
import { loadLayersFromConfig } from './layer-controls.js';
import { setupSidebarUI } from './sidebar.js';

async function initialiseApp() {
  await initMap();

  const map = getMap();
  if (!map) {
    console.error('Map failed to initialize.');
    return;
  }

  map.on('load', async () => {
    try {
      await loadLayersFromConfig(map);
      setupSidebarUI();
    } catch (err) {
      console.error('Error during app initialisation:', err); //Console log for debugging
      alert('App failed to load completely. Check the console for details.');
    }
  });
}

window.addEventListener('DOMContentLoaded', initialiseApp);
