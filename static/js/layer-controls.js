// Layer controls and composite layer logic (config-driven)
import { map } from './map-init.js';

export let subparameterLayers = {};
let compositeLayer = null;

export async function loadLayersFromConfig() {
  const res = await fetch('static/data/layers-config.json');
  const config = await res.json();
  for (const layerDef of config) {
    if (layerDef.type === 'geojson') {
      const layer = L.layerGroup();
      fetch(layerDef.source)
        .then(res => res.json())
        .then(geojson => {
          layer.clearLayers();
          geojson.features.forEach(feature => {
            const [lng, lat] = feature.geometry.coordinates;
            const props = feature.properties;
            const marker = L.circleMarker([lat, lng], {
              radius: 6,
              color: layerDef.color || 'blue',
              fillColor: layerDef.color || 'blue',
              fillOpacity: 0.6,
            });
            marker.bindPopup(`<strong>${props.location}</strong><br>Date: ${props.date}<br>Depth: ${props.depth_range}`);
            layer.addLayer(marker);
          });
        });
      subparameterLayers[layerDef.key] = layer;
    } else if (layerDef.type === 'image') {
      subparameterLayers[layerDef.key] = L.imageOverlay(layerDef.source, [[3.10, 101.65], [3.18, 101.73]], {
        opacity: layerDef.opacity || 0.5,
      });
    } else if (layerDef.type === 'rectangle') {
      subparameterLayers[layerDef.key] = L.layerGroup([
        L.rectangle(layerDef.bounds, {
          color: layerDef.color || '#006400',
          fillOpacity: layerDef.fillOpacity || 0.4,
          weight: 1
        })
      ]);
    }
  }
}

export function updateCompositeLayer() {
  // Logic for composite layer to be added
  if (compositeLayer) {
    map.removeLayer(compositeLayer);
    compositeLayer = null;
  }
}

export function updateExportButtonState() {
  const anyChecked = [...document.querySelectorAll('.param-toggle')].some(i => i.checked);
  document.getElementById('download-map').disabled = !anyChecked;
}
