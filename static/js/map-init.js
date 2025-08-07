import { getStateLocations } from './boundaries.js';

let mapInstance;
let stateLocations = [];

export const BASE_STYLES = [
  {
    id: 'default',
    name: 'Default',
    url: 'https://api.maptiler.com/maps/basic-v2/style.json?key=TgrDzodq8E10HppJIC77',
    thumbnail: 'static/img/map-thumbnails/Default.png'
  },
  {
    id: 'topographic',
    name: 'Topographic',
    url: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=TgrDzodq8E10HppJIC77',
    thumbnail: 'static/img/map-thumbnails/Topographical.png'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://api.maptiler.com/maps/satellite/style.json?key=TgrDzodq8E10HppJIC77',
    thumbnail: 'static/img/map-thumbnails/Satellite.png'
  },
  {
    id: 'canvas-light',
    name: 'Canvas (Light)',
    url: 'https://api.maptiler.com/maps/01985a16-8e74-7344-b1bb-2b87be989046/style.json?key=TgrDzodq8E10HppJIC77',
    thumbnail: 'static/img/map-thumbnails/Canvas (Light).png'
  }
];
window.BASE_STYLES = BASE_STYLES;

/**
 * Initialize the MapLibre map instance.
 */
export async function initMap() {
  stateLocations = await getStateLocations();

  mapInstance = new maplibregl.Map({
    container: 'map',
    style: BASE_STYLES[0].url,
    center: [108.20747, 4.200995],
    zoom: 5.5,
    preserveDrawingBuffer: true
  });

   window.mapInstance = mapInstance;

  mapInstance.on('load', () => {
    console.log('MapLibre map loaded');
  });

  mapInstance.on('error', (e) => {
    console.error('MapLibre error:', e);
  });

  //Map Controls
  mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right'); 

  //Dyamic Scale Bar
  mapInstance.addControl(new maplibregl.ScaleControl({
    maxWidth: 150,
    unit: 'metric' 
  }), 'bottom-right');
}

/**
 * Returns the initialised map instance.
 */
export function getMap() {
  return window.mapInstance;
}

/**
 * Returns the fetched list of state locations.
 */
export function getLocations() {
  return stateLocations;
}

/**
 * Change the current base style of the map.
 */
export function setBaseMapStyle(styleUrl) {
  console.log('🎨 setBaseMapStyle called with:', styleUrl);
  
  if (mapInstance && styleUrl) {
    mapInstance.setStyle(styleUrl);

    // Use 'styledata' event instead of 'style.load' - more reliable
    mapInstance.once('styledata', async (e) => {
      // Only proceed if this is the final styledata event (when style is fully loaded)
      if (e.dataType === 'style') {
        console.log('✅ styledata event fired for:', styleUrl);
        
        // Get selected state from dropdown
        const selectedState = document.getElementById('location-select')?.value;
        console.log('📍 Selected state:', selectedState);

        // Re-add overlays (flood points, heatmaps, etc.)
        console.log('🔄 Re-adding overlays...');
        const { loadLayersFromConfig } = await import('./layer-controls.js');
        await loadLayersFromConfig(mapInstance, selectedState);

        // Re-add boundary layers for current state FIRST
        const { updateBoundaryLayersForState } = await import('./sidebar.js');
        if (selectedState && selectedState !== 'Select...') {
          console.log('🔄 Re-adding boundaries...');
          await updateBoundaryLayersForState(selectedState);
        }

        // THEN re-attach layer toggle event handlers (after boundaries are loaded)
        console.log('🔄 Re-attaching event handlers...');
        const { attachLayerPanelListeners } = await import('./sidebar.js');
        attachLayerPanelListeners();

        // FINALLY restore visibility for any checked toggles
        setTimeout(() => {
          document.querySelectorAll('.map-toggle:checked').forEach(toggle => {
            const layerKey = toggle.dataset.layer;
            const layerId = `${layerKey}-layer`;
            console.log('🔘 Restoring visibility for:', layerKey, layerId);
            if (mapInstance.getLayer(layerId)) {
              mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
              console.log('✅ Visibility restored for:', layerId);
            } else {
              console.warn('❌ Layer not found when restoring visibility:', layerId);
            }
          });
          
          // Sync overlays with sidebar toggles after everything is ready
          import('./active-layers.js').then(({ syncActiveOverlaysFromSidebar }) => {
            syncActiveOverlaysFromSidebar();
          });
        }, 200); // Increase timeout slightly

        console.log('🎉 Style change complete and handlers re-attached');
      }
    });
  }
}

/**
 * Fly to a selected location by name.
 */
export function flyToLocation(stateName) {
  const loc = stateLocations.find(l => l.name === stateName);
  if (loc && mapInstance) {
    mapInstance.flyTo({ center: loc.center, zoom: loc.zoom });
  }
}

/**
 * Utility to populate the location dropdown, if it's present in the DOM.
 * This is meant to be called from sidebar.js after rendering.
 */
export function populateLocationDropdown() {
  const select = document.getElementById('location-select');
  if (!select || !stateLocations.length) {
    console.warn('Dropdown not populated: select missing or no stateLocations.');
    return;
  }

  select.innerHTML = '<option disabled selected>Select...</option>';
  stateLocations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc.name;
    option.textContent = loc.name;
    select.appendChild(option);
  });

  console.log('stateLocations length:', stateLocations.length);
  console.log('stateLocations sample:', stateLocations[0]);

}
