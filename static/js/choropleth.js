import { normaliseProperties } from './boundaryNormaliser.js';

/**
 * Adds a 'flood_count' property to each polygon in boundaryGeoJson,
 * counting how many points from floodGeoJson fall inside.
 * @param {Object} boundaryGeoJson - The boundary polygons (state, parlimen, etc)
 * @param {Object} floodGeoJson - The flood points
 * @returns {Object} - The boundaryGeoJson with flood_count property added
 */
export function addFloodCountsToPolygons(boundaryGeoJson, floodGeoJson) {
  boundaryGeoJson.features.forEach(poly => {
    const count = floodGeoJson.features.filter(pt =>
      turf.booleanPointInPolygon(pt, poly)
    ).length;
    poly.properties.flood_count = count;
  });
  return boundaryGeoJson;
}

/**
 * Show the flood choropleth layer, with dynamic popup label.
 * @param {maplibregl.Map} map
 * @param {Object} boundaryGeoJson
 * @param {string} labelProp - property name for popup label (e.g. 'state', 'parlimen', etc)
 */
export function showFloodChoropleth(map, boundaryGeoJson, labelProp = 'state') {
  const normProps = normaliseProperties(labelProp, props);

  // Remove previous choropleth if exists
  if (map.getLayer('flood-choropleth')) map.removeLayer('flood-choropleth');
  if (map.getSource('flood-choropleth')) map.removeSource('flood-choropleth');

  map.addSource('flood-choropleth', { type: 'geojson', data: boundaryGeoJson });
  map.addLayer({
    id: 'flood-choropleth',
    type: 'fill',
    source: 'flood-choropleth',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'flood_count'],
        0, '#f7fbff',
        1, '#c6dbef',
        5, '#6baed6',
        10, '#2171b5'
      ],
      'fill-opacity': 0.6,
      'fill-outline-color': '#333'
    }
  });

  // Popup on hover
  map.on('mousemove', 'flood-choropleth', (e) => {
    const props = e.features[0].properties;
    map.getCanvas().style.cursor = 'pointer';
    new maplibregl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${props[labelProp] || 'Area'}</strong><br>Floods: ${props.flood_count}`)
      .addTo(map);
  });
  map.on('mouseleave', 'flood-choropleth', () => {
    map.getCanvas().style.cursor = '';
    document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());
  });
}