// Shared state for overlays
export let activeOverlays = []; // [{ key, label, opacity }]
let selectedLayerKey = null;

// Utility to get overlay label by key (customize as needed)
const overlayLabels = {
  'flood': 'Flood Points',
  'flood-frequency': 'Flood Frequency',
  'flood-density': 'Flood Density',
  'lst': 'LST Heatmap'
};

// Render the Active Layers panel
export function renderActiveLayersPanel(containerId = 'active-layers-panel') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Panel header and opacity input
  container.innerHTML = `
    <div class="panel-header">
      <label for="layer-opacity" class="opacity-label">Opacity</label>
      <input type="number" id="layer-opacity" min="0" max="100" value="100" class="opacity-input" />
    </div>
    <div id="active-layers-content"></div>
    <button id="reset-map-btn" class="btn btn-secondary reset-btn">Reset Map</button>
  `;

  const layersContent = container.querySelector('#active-layers-content');
  layersContent.innerHTML = '';

  activeOverlays.forEach(layer => {
    const rect = document.createElement('div');
    rect.className = 'active-layer-rect' + (layer.key === selectedLayerKey ? ' selected' : '');
    rect.dataset.key = layer.key;
    rect.innerHTML = `
      <span class="layer-name">${layer.label}</span>
      <span class="drag-handle" style="cursor:grab;">☰</span>
    `;
    layersContent.appendChild(rect);

    // Select layer on click
    rect.addEventListener('click', () => {
      selectedLayerKey = layer.key;
      document.getElementById('layer-opacity').value = Math.round((layer.opacity ?? 1) * 100);
      renderActiveLayersPanel(containerId);
    });
  });

  // Set opacity input to selected layer's value
  const opacityInput = container.querySelector('#layer-opacity');
  if (selectedLayerKey) {
    const selectedLayer = activeOverlays.find(l => l.key === selectedLayerKey);
    opacityInput.value = Math.round((selectedLayer?.opacity ?? 1) * 100);
    opacityInput.disabled = false;
  } else {
    opacityInput.value = 100;
    opacityInput.disabled = true;
  }

  // Opacity input logic
  opacityInput.oninput = () => {
    if (!selectedLayerKey) return;
    const layer = activeOverlays.find(l => l.key === selectedLayerKey);
    if (layer) {
      layer.opacity = opacityInput.value / 100;
      window.mapInstance.setPaintProperty(
        layer.key + '-layer',
        layer.key === 'flood-density' ? 'heatmap-opacity' : 'raster-opacity',
        layer.opacity
      );
    }
  };

  // Reset button logic
  const resetBtn = container.querySelector('#reset-map-btn');
  resetBtn.onclick = () => {
    activeOverlays.forEach(layer => {
      window.mapInstance.setLayoutProperty(layer.key + '-layer', 'visibility', 'none');
      layer.opacity = 1;
      const sidebarToggle = document.querySelector(`[data-layer="${layer.key}"]`);
      if (sidebarToggle) sidebarToggle.checked = false;
    });
    activeOverlays = [];
    selectedLayerKey = null;
    renderActiveLayersPanel(containerId);
  };

  // Drag-and-drop (simple implementation)
  let dragSrc = null;
  layersContent.querySelectorAll('.active-layer-rect').forEach(rect => {
    rect.addEventListener('mousedown', e => {
      dragSrc = rect;
      dragSrc.classList.add('dragging');
    });
    rect.addEventListener('mouseup', e => {
      dragSrc?.classList.remove('dragging');
      dragSrc = null;
    });
    rect.addEventListener('dragstart', e => e.preventDefault());
  });
  layersContent.addEventListener('mousemove', e => {
    if (dragSrc) {
      const over = e.target.closest('.active-layer-rect');
      if (over && over !== dragSrc) {
        layersContent.insertBefore(dragSrc, over.nextSibling);
        // Update activeOverlays order
        activeOverlays = Array.from(layersContent.querySelectorAll('.active-layer-rect')).map(el => {
          const key = el.dataset.key;
          return activeOverlays.find(l => l.key === key);
        });
        updateMapLayerOrder();
      }
    }
  });
}

// Update map layer order based on activeOverlays
function updateMapLayerOrder() {
  activeOverlays.forEach((layer, i) => {
    const nextLayer = activeOverlays[i + 1];
    const beforeLayerId = nextLayer ? nextLayer.key + '-layer' : 'boundary-layer';
    window.mapInstance.moveLayer(layer.key + '-layer', beforeLayerId);
  });
}

// Call this after toggling overlays in sidebar
export function syncActiveOverlaysFromSidebar() {
  activeOverlays = [];
  document.querySelectorAll('.map-toggle:checked').forEach(input => {
    const key = input.dataset.layer;
    activeOverlays.push({
      key,
      label: overlayLabels[key] || key,
      opacity: 1
    });
  });
  // Reset selection if no overlays
  if (!activeOverlays.some(l => l.key === selectedLayerKey)) {
    selectedLayerKey = activeOverlays.length ? activeOverlays[0].key : null;
  }
  renderActiveLayersPanel('active-layers-panel');
}