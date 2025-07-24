export let subparameterLayers = {};
let compositeLayer = null;


/**
 * Loads and adds configured layers from JSON into the given map.
 * Currently supports GeoJSON point layers (e.g., flood points).
 * @param {maplibregl.Map} map - MapLibre map instance
 */
export async function loadLayersFromConfig(map, selectedState) {
  const res = await fetch('static/data/layers-config.json');
  const config = await res.json();

  for (const layerDef of config) {
    const sourceId = `${layerDef.key}-source`;
    const layerId = `${layerDef.key}-layer`;

    if (layerDef.type === 'geojson') {
      let geojson = await fetch(layerDef.source).then(r => r.json());

      // Filter flood points by selectedState if this is the flood layer
      if (layerDef.key === 'flood' && selectedState) {
        geojson.features = geojson.features.filter(f =>
          f.properties.state === selectedState
        );
      }

      // Always add or update the source before adding the layer
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
      }

      // Add the layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          layout: { visibility: 'none' },
          paint: {
            'circle-radius': 6,
            'circle-color': layerDef.color || 'blue',
            'circle-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#222'
          }
        });
      }

      subparameterLayers[layerDef.key] = layerId;

      // Pop-up on hover for flood points
      if (layerDef.key === 'flood') {
        map.on('mouseenter', layerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const coordinates = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          const popupContent = Object.entries(props)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join('<br>');
          // Remove any existing popups
          document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());
          new maplibregl.Popup({ closeButton: false, closeOnClick: false })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());
        });
      }
    }

    // --- Support for image overlays (e.g., LST heatmap) ---
    if (layerDef.type === 'image') {
      // Use bounds from config if present, otherwise hardcoded KL bounds
      const bounds = layerDef.bounds || [
        [101.6771131438013, 3.174396645025634], // top-left (west, north)
        [101.7228295528681, 3.174396645025634], // top-right (east, north)
        [101.7228295528681, 3.121411961229557], // bottom-right (east, south)
        [101.6771131438013, 3.121411961229557]  // bottom-left (west, south)
      ];

      // Remove existing layer/source if present
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: 'image',
        url: layerDef.source,
        coordinates: bounds
      });

      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': layerDef.opacity ?? 0.9
        },
        layout: { visibility: 'none' }
      });

      subparameterLayers[layerDef.key] = layerId;
    }
  }
}

/**
 * Composite layer logic placeholder — to be implemented when needed.
 */
export function updateCompositeLayer() {
  // Placeholder for future logic
}

/**
 * Enables or disables the export button based on visible subparameter layers.
 * Tied to sidebar checkboxes with class 'param-toggle'.
 */
export function updateExportButtonState() {
  const anyChecked = [
    ...document.querySelectorAll('.map-toggle'),
    document.getElementById('toggle-flood-frequency')
  ].some(i => i && i.checked);
  const btn = document.getElementById('download-map');
  if (btn) btn.disabled = !anyChecked;
}
