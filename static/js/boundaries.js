const boundarySources = {
  state: 'data/boundaries/administrative_1_state.geojson',
  district: 'data/boundaries/administrative_2_district.geojson',
  parlimen: 'data/boundaries/electoral_0_parlimen.geojson',
  dun: 'data/boundaries/electoral_1_dun.geojson',
};

/**
 * Loads and displays a boundary layer for a given type and state.
 * @param {maplibregl.Map} map - MapLibre map instance.
 * @param {string} type - One of: 'state', 'district', 'parlimen', 'dun'.
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

  const filtered = {
    ...geojson,
    features: geojson.features.filter(f => f.properties.state === selectedState)
  };

  // Add to map
  map.addSource(sourceId, {
    type: 'geojson',
    data: filtered
  });

  map.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': ' #000F9F',
      'line-width': 2
    }
  });
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
      name: f.properties.state,
      center,
      zoom: 9
    };
  });

  // Sort alphabetically by name
  locations.sort((a, b) => a.name.localeCompare(b.name));
  return locations;
}

// Internal utility — center of outer ring of polygon
function getPolygonCenter(coords) {
  const polygon = coords[0]; // outer ring
  const lats = polygon.map(c => c[1]);
  const lngs = polygon.map(c => c[0]);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [lng, lat];
}
