import { normaliseProperties } from './boundaryNormaliser.js';

const boundarySources = {
  state: 'data/boundaries/State_MY.json',
  district: 'data/boundaries/District_MY.json',
  subdistrict: 'data/boundaries/Subdistrict_MY.json',
  parlimen: 'data/boundaries/Parliament_MY.json',
  dun: 'data/boundaries/DUN_Peninsular_MY.json',
};

const STATE_CODE_MAP = {
  'Johor': '01',
  'Kedah': '02',
  'Kelantan': '03',
  'Melaka': '04',
  'Negeri Sembilan': '05',
  'Pahang': '06',
  'Pulau Pinang': '07',
  'Perak': '08',
  'Perlis': '09',
  'Selangor': '10',
  'Terengganu': '11',
  'Sabah': '12',
  'Sarawak': '13',
  'Wilayah Persekutuan Kuala Lumpur': '14',
  'Wilayah Persekutuan Labuan': '15',
  'Wilayah Persekutuan Putrajaya': '16'
};

const PARLIMEN_STATE_NAME_MAP = {
  'Wilayah Persekutuan Kuala Lumpur': 'WP KUALA LUMPUR',
  'Wilayah Persekutuan Putrajaya': 'WP PUTRAJAYA',
  'Wilayah Persekutuan Labuan': 'WP LABUAN'
};

function normalizeString(str) {
  return (str || '').toString().trim().toLowerCase();
}

const STATE_COLOR_MAP = {
  'Johor': '#E69F00',
  'Kedah': '#56B4E9',
  'Kelantan': '#009E73',
  'Melaka': '#F0E442',
  'Negeri Sembilan': '#0072B2',
  'Pahang': '#D55E00',
  'Pulau Pinang': '#CC79A7',
  'Perak': '#999999',
  'Perlis': '#117733',
  'Selangor': '#44AA99',
  'Terengganu': '#88CCEE',
  'Sabah': '#DDCC77',
  'Sarawak': '#AA4499',
  'Wilayah Persekutuan Kuala Lumpur': '#332288',
  'Wilayah Persekutuan Labuan': '#882255',
  'Wilayah Persekutuan Putrajaya': '#661100'
};

/**
 * Loads and displays a boundary layer for a given type and state.
 * @param {maplibregl.Map} map - MapLibre map instance.
 * @param {string} type - One of: 'state', 'district', 'subdistrict', 'parlimen', 'dun'.
 * @param {string} selectedState - The state name to filter the boundary to.
 */
export async function loadBoundaryLayer(map, type, selectedState) {
  console.log('Loading boundary:', { type, selectedState });

  const sourceId = `boundary-source-${type}`;
  const layerId = `boundary-layer-${type}`;

  // Remove existing layer/source if present
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  // Load and filter GeoJSON
  const response = await fetch(boundarySources[type]);
  const geojson = await response.json();

  // Debug: log raw and normalised properties
  // geojson.features.forEach(f => {
  //   console.log('Feature properties:', f.properties);
  //   console.log('Normalised:', normaliseProperties(type, f.properties));
  // });

  let filtered;
  if (type === 'state') {
    // Case-insensitive match for state boundaries
    filtered = {
      ...geojson,
      features: geojson.features.filter(
        f => normalizeString(normaliseProperties(type, f.properties).name) === normalizeString(selectedState)
      )
    };
  } else if (type === 'district') {
    // Filter districts by state code prefix in ID
    const stateCode = STATE_CODE_MAP[selectedState];
    filtered = {
      ...geojson,
      features: geojson.features.filter(
        f => f.properties.ID && f.properties.ID.startsWith(stateCode)
      )
    };
  } else if (type === 'subdistrict') {
    // Filter subdistricts by state code prefix in ID
    const stateCode = STATE_CODE_MAP[selectedState];
    filtered = {
      ...geojson,
      features: geojson.features.filter(
        f => f.properties.ID && f.properties.ID.startsWith(stateCode)
      )
    };
  } else if (type === 'parlimen') {
    // Use mapping for parlimen boundaries
    const mappedState = PARLIMEN_STATE_NAME_MAP[selectedState] || selectedState;
    filtered = {
      ...geojson,
      features: geojson.features.filter(
        f => normalizeString(normaliseProperties(type, f.properties).state) === normalizeString(mappedState)
      )
    };
  } else {
    // Case-insensitive match for dun, subdistrict
    filtered = {
      ...geojson,
      features: geojson.features.filter(
        f => normalizeString(normaliseProperties(type, f.properties).state) === normalizeString(selectedState)
      )
    };
  }

  // Debug: log filtered results
  console.log('Filtered features count:', filtered.features.length);
  console.log('Filtered GeoJSON:', filtered);

  // Add to map
  map.addSource(sourceId, {
    type: 'geojson',
    data: filtered
  });

  map.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    minzoom: 8,
    paint: {
      'line-color': STATE_COLOR_MAP[selectedState] || '#000F9F', // fallback color
      'line-width': 2
    }
  });

  // Debug: confirm source/layer added
  console.log('Source added:', map.getSource(sourceId));
  console.log('Layer added:', map.getLayer(layerId));
}

/**
 * Returns a list of state names with approximate map center coordinates.
 * Used by map-init.js to populate dropdown + flyTo.
 */
export async function getStateLocations() {
  const response = await fetch(boundarySources.state);
  const geojson = await response.json();

  // Map and then sort alphabetically by name
  const locations = geojson.features.map(f => {
    let center = [0, 0];
    if (f.geometry?.type === 'Polygon') {
      center = getPolygonCenter(f.geometry.coordinates);
    } else if (f.geometry?.type === 'MultiPolygon') {
      center = getPolygonCenter(f.geometry.coordinates[0]);
    }
    return {
      name: normaliseProperties('state', f.properties).name,
      center,
      zoom: 9
    };
  });

  // Sort alphabetically by name
  locations.sort((a, b) => a.name.localeCompare(b.name));
  return locations;
}

// Helper function to get center of outer ring of polygon
function getPolygonCenter(coords) {
  const polygon = coords[0]; // outer ring
  const lats = polygon.map(c => c[1]);
  const lngs = polygon.map(c => c[0]);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [lng, lat];
}