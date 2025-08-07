import { initMap, getMap } from './map-init.js';
import { loadLayersFromConfig } from './layer-controls.js';
import { setupSidebarUI } from './sidebar.js';
import { renderActiveLayersPanel, syncActiveOverlaysFromSidebar } from './active-layers.js';

async function initialiseApp() {
  await initMap();

  // Initialise sidebar state with defaults
  window.sidebarState = {
    boundaries: {},
    layers: {},
    location: 'Select...',
    baseStyle: window.BASE_STYLES?.[0]?.url || null 
  };
  
  const map = getMap();
  if (!map) {
    console.error('Map failed to initialize.');
    return;
  }

  map.on('load', async () => {
    try {
      await loadLayersFromConfig(map);
      setupSidebarUI();

      // Sync and render Active Layers panel after sidebar and layers are set up
      syncActiveOverlaysFromSidebar();
      renderActiveLayersPanel('active-layers-panel');

    } catch (err) {
      console.error('Error during app initialisation:', err); //Console log for debugging
      alert('App failed to load completely. Check the console for details.');
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initialiseApp();

  const panel = document.getElementById('active-layers-panel');
  const tab = document.getElementById('active-layers-tab');
  let panelOpen = false;

  tab.addEventListener('click', (e) => {
    e.stopPropagation();
    panelOpen = !panelOpen;
    if (panelOpen) {
      panel.classList.add('open');
      tab.classList.add('open');
      import('./active-layers.js').then(mod => {
        mod.renderActiveLayersPanel('active-layers-panel');
      });
    } else {
      panel.classList.remove('open');
      tab.classList.remove('open');
    }
  });
});
