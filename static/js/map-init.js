// map-init.js
import { getStateLocations } from './boundaries.js';

let mapInstance;
let stateLocations = [];

export const BASE_STYLES = [
  {
    name: 'Default',
    url: 'https://api.maptiler.com/maps/basic-v2/style.json?key=TgrDzodq8E10HppJIC77',
  },
  {
    name: 'Topographic',
    url: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=TgrDzodq8E10HppJIC77',
  },
  {
    name: 'Satellite',
    url: 'https://api.maptiler.com/maps/satellite/style.json?key=TgrDzodq8E10HppJIC77',
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

  mapInstance.on('load', () => {
    console.log('MapLibre map loaded');
    // Don't assume sidebar exists; let sidebar call populateLocationDropdown() after render.
  });

  mapInstance.on('error', (e) => {
    console.error('MapLibre error:', e);
  });

  mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
}

/**
 * Returns the initialized map instance.
 */
export function getMap() {
  return mapInstance;
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
  if (mapInstance && styleUrl) {
    mapInstance.setStyle(styleUrl);
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
