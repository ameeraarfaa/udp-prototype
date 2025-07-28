// Shared state for overlays
export let activeOverlays = []; // [{ key, label, opacity }]

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

  container.innerHTML = activeOverlays.map(layer => `
    <div class="active-layer" data-key="${layer.key}">
      <span class="drag-handle" style="cursor:grab;">☰</span>
      <span class="layer-label">${layer.label}</span>
      <input type="range" min="0" max="1" step="0.01" value="${layer.opacity}" class="opacity-slider" />
      <button class="remove-layer btn btn-sm btn-danger ms-2">✕</button>
    </div>
  `).join('') + `
    <button id="reset-active-layers" class="btn btn-warning mt-2">Reset</button>
  `;

  attachActiveLayerListeners(container);
}

// Attach listeners for opacity, remove, reset, and drag-and-drop
function attachActiveLayerListeners(container) {
  // Opacity sliders
  container.querySelectorAll('.opacity-slider').forEach(slider => {
    slider.addEventListener('input', e => {
      const key = e.target.closest('.active-layer').dataset.key;
      const value = parseFloat(e.target.value);
      const layer = activeOverlays.find(l => l.key === key);
      if (layer) {
        layer.opacity = value;
        // Update map opacity
        window.mapInstance.setPaintProperty(
          layer.key + '-layer',
          layer.key === 'flood-density' ? 'heatmap-opacity' : 'raster-opacity',
          value
        );
      }
    });
  });

  // Remove layer
  container.querySelectorAll('.remove-layer').forEach(btn => {
    btn.addEventListener('click', e => {
      const key = e.target.closest('.active-layer').dataset.key;
      activeOverlays = activeOverlays.filter(l => l.key !== key);
      // Hide layer on map
      window.mapInstance.setLayoutProperty(key + '-layer', 'visibility', 'none');
      // Uncheck sidebar toggle if present
      const sidebarToggle = document.querySelector(`[data-layer="${key}"]`);
      if (sidebarToggle) sidebarToggle.checked = false;
      renderActiveLayersPanel(container.id);
    });
  });

  // Reset button
  const resetBtn = container.querySelector('#reset-active-layers');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Hide all overlays and reset opacity/order
      activeOverlays.forEach(layer => {
        window.mapInstance.setLayoutProperty(layer.key + '-layer', 'visibility', 'none');
        // Uncheck sidebar toggle if present
        const sidebarToggle = document.querySelector(`[data-layer="${layer.key}"]`);
        if (sidebarToggle) sidebarToggle.checked = false;
      });
      activeOverlays = [];
      renderActiveLayersPanel(container.id);
    });
  }

  // Drag-and-drop (simple implementation)
  // For production, use SortableJS or similar for better UX
  let dragSrc = null;
  container.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      dragSrc = e.target.closest('.active-layer');
      dragSrc.classList.add('dragging');
    });
    handle.addEventListener('mouseup', e => {
      dragSrc?.classList.remove('dragging');
      dragSrc = null;
    });
    handle.addEventListener('dragstart', e => e.preventDefault());
  });
  container.addEventListener('mousemove', e => {
    if (dragSrc) {
      const over = e.target.closest('.active-layer');
      if (over && over !== dragSrc) {
        container.insertBefore(dragSrc, over.nextSibling);
        // Update activeOverlays order
        activeOverlays = Array.from(container.querySelectorAll('.active-layer')).map(el => {
          const key = el.dataset.key;
          return activeOverlays.find(l => l.key === key);
        });
        // Update map z-index/order
        updateMapLayerOrder();
      }
    }
  });
}

// Update map layer order based on activeOverlays
function updateMapLayerOrder() {
  // Base map stays bottom, boundaries stay top
  // Move overlays in activeOverlays order, from bottom to top
  activeOverlays.forEach((layer, i) => {
    const nextLayer = activeOverlays[i + 1];
    const beforeLayerId = nextLayer ? nextLayer.key + '-layer' : 'boundary-layer'; // boundary-layer is always top
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
  renderActiveLayersPanel('active-layers-panel');
}