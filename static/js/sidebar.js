// sidebar.js
import { getMap, getLocations, flyToLocation, setBaseMapStyle, populateLocationDropdown } from './map-init.js';
import { subparameterLayers, updateCompositeLayer, updateExportButtonState } from './layer-controls.js';
import { exportVisibleMap } from './export.js';
import { addFloodCountsToPolygons, showFloodChoropleth } from './choropleth.js';
import { renderActiveLayersPanel, syncActiveOverlaysFromSidebar } from './active-layers.js';

// idebar state
window.sidebarState = {
  boundaries: {},
  layers: {},
  location: null,
  baseStyle: null
};

// Maps UI boundary labels to internal type keys
const BOUNDARY_LABEL_TO_TYPE = {
  'State': 'state',
  'District': 'district',
  'Parliament': 'parlimen',
  'State Legislative Assembly (DUN)': 'dun'
};

// The order and labels to display in the boundaries UI section
const boundaryLabels = Object.keys(BOUNDARY_LABEL_TO_TYPE);

// Maps internal type keys to their GeoJSON file paths
const BOUNDARY_FILE_MAP = {
  state: 'data/boundaries/administrative_1_state.geojson',
  district: 'data/boundaries/administrative_2_district.geojson',
  parlimen: 'data/boundaries/electoral_0_parlimen.geojson',
  dun: 'data/boundaries/electoral_1_dun.geojson'
};

// Maps internal type keys to the property name used for popups/labels in GeoJSON 
const LABEL_PROP_MAP = {
  state: 'state',
  district: 'district',
  parlimen: 'parlimen',
  dun: 'dun'
};

window.activeBoundaryType = 'state'; // Tracks active boundary type

const icons = [
  { id: 'icon-general', panel: 'general' },
  { id: 'icon-layers', panel: 'layers' },
  { id: 'icon-account', panel: 'account' },
  { id: 'icon-active-layers', panel: 'active-layers' }
];

let expanded = null;
let locked = false;

function getPanelContent(panel) {
  if (panel === 'general') {
    return `
      <h5>Map Settings</h5>
      <div class="mb-3">
        <label class="form-label">Base Map Style</label>
        <select id="base-style-select" class="form-select mb-2">
          ${window.BASE_STYLES?.map(s => `<option value="${s.url}">${s.name}</option>`).join('') ?? ''}
        </select>

        <label class="form-label">Select Location</label>
        <select id="location-select" class="form-select mb-2">
          <option disabled selected>Select...</option>
          ${getLocations().map(loc => `<option value="${loc.name}">${loc.name}</option>`).join('')}
        </select>

        <label class="form-label mt-3">Boundaries</label>
        <div id="boundary-toggles" class="mb-2">
          ${boundaryLabels.map(label => `
            <div class="form-check">
              <input class="form-check-input boundary-toggle" type="checkbox" id="boundary-${BOUNDARY_LABEL_TO_TYPE[label]}" data-type="${BOUNDARY_LABEL_TO_TYPE[label]}">
              <label class="form-check-label" for="boundary-${BOUNDARY_LABEL_TO_TYPE[label]}">${label}</label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (panel === 'layers') {
  return `
    <h5>Layers</h5>
    <div id="parameters-section">
      <div class="accordion" id="parameterAccordion">

        <!-- Climate Accordion -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#climate-collapse">
              <span class="text-muted me-2" title="Climate indicators">🛈</span> Climate
            </button>
          </h2>
          <div id="climate-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body">
              <div class="mb-2">
                <div class="fw-bold">Flood</div>
                <div class="form-check ms-3">
                  <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood" data-layer="flood" />
                  <label class="form-check-label" for="toggle-flood">Flood Points</label>
                </div>
                <div class="form-check ms-3">
                  <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood-frequency" data-layer="flood-frequency" />
                  <label class="form-check-label" for="toggle-flood-frequency">Flood Frequency</label>
                </div>
                <div class="form-check ms-3">
                  <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood-density" data-layer="flood-density" />
                  <label class="form-check-label" for="toggle-flood-density">Flood Density</label>
                </div>
              </div>
              <div class="mb-2">
                <div class="fw-bold">Land Surface Temperature</div>
                <div class="form-check ms-3">
                  <input class="form-check-input map-toggle" type="checkbox" id="toggle-lst" data-layer="lst" />
                  <label class="form-check-label" for="toggle-lst">LST Heatmap</label>
                </div>
              </div>
              <div class="mb-2">
                <div class="fw-bold">Distance to Water</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Environment Accordion -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#environment-collapse">
              <span class="text-muted me-2" title="Environment indicators">🛈</span> Environment
            </button>
          </h2>
          <div id="environment-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted">
              Subparameters to be added here
            </div>
          </div>
        </div>

        <!-- Economy Accordion -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#economy-collapse">
              <span class="text-muted me-2" title="Economy indicators">🛈</span> Economy
            </button>
          </h2>
          <div id="economy-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted">
              Subparameters to be added here
            </div>
          </div>
        </div>

        <!-- Population Accordion -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#population-collapse">
              <span class="text-muted me-2" title="Population indicators">🛈</span> Population
            </button>
          </h2>
          <div id="population-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted">
              Subparameters to be added here
            </div>
          </div>
        </div>

        <!-- Social Accordion -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#social-collapse">
              <span class="text-muted me-2" title="Social indicators">🛈</span> Social
            </button>
          </h2>
          <div id="social-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted">
              Subparameters to be added here
            </div>
          </div>
        </div>
    </div>
    <button id="download-map" class="btn btn-secondary w-100 mt-4" disabled>Export Map (.jpeg)</button>
  `;
  }

  if (panel === 'Account') {
    return `<h5>Account</h5><div class="text-muted">No account options yet.</div>`;
  }

  if (panel === 'active-layers') {
    return `<div id="active-layers-panel"></div>`;
  }

  return '';

}

function showPanel(panel) {
  const sidebarExpand = document.getElementById('sidebar-expand');
  sidebarExpand.classList.add('expanded');
  sidebarExpand.innerHTML = getPanelContent(panel);

  if (panel === 'general') {
    attachGeneralListeners();
    populateLocationDropdown();
  }

  if (panel === 'layers') attachLayerPanelListeners();

  if (panel === 'active-layers') {
    renderActiveLayersPanel('active-layers-panel');
  }

  // Export button logic
  const downloadButton = document.getElementById('download-map');
  if (downloadButton) {
    downloadButton.addEventListener('click', exportVisibleMap);
  }
}

function hidePanel() {
  const sidebarExpand = document.getElementById('sidebar-expand');
  sidebarExpand.classList.remove('expanded');
  sidebarExpand.innerHTML = '';
}

function lockPanel(panel) {
  expanded = panel;
  locked = true;
  showPanel(panel);
}

function unlockPanel() {
  expanded = null;
  locked = false;
  hidePanel();
}

function attachGeneralListeners() {
  const map = getMap();

  document.getElementById('base-style-select')?.addEventListener('change', (e) => {
    setBaseMapStyle(e.target.value);
  });

  document.getElementById('location-select')?.addEventListener('change', async (e) => {
    const selectedState = e.target.value;
    if (selectedState && selectedState !== 'Select...') {
      flyToLocation(selectedState);
      await updateBoundaryLayersForState(selectedState);
    }
  });

  document.querySelectorAll('.boundary-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const type = e.target.dataset.type;
      const checked = e.target.checked;
      const state = document.getElementById('location-select')?.value;
      const map = getMap();

      if (checked && state && state !== 'Select...') {
        // Uncheck all other boundary toggles
        document.querySelectorAll('.boundary-toggle').forEach(otherToggle => {
          if (otherToggle !== e.target) otherToggle.checked = false;
        });

        window.activeBoundaryType = type; // Track the current boundary type
        const { loadBoundaryLayer } = await import('./boundaries.js');
        loadBoundaryLayer(map, type, state);

        // If choropleth is active, update it
        const choroplethToggle = document.getElementById('toggle-flood-choropleth');
        if (choroplethToggle && choroplethToggle.checked) {
          await showFloodCountChoropleth(type);
        }
      } else {
        const sourceId = `boundary-source-${type}`;
        const layerId = `boundary-layer-${type}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    });
  });
}

async function updateBoundaryLayersForState(state) {
  const { loadBoundaryLayer } = await import('./boundaries.js');
  const map = getMap();
  document.querySelectorAll('.boundary-toggle:checked').forEach(toggle => {
    const type = toggle.dataset.type;
    loadBoundaryLayer(map, type, state);
  });
}

function attachLayerPanelListeners() {
  const map = getMap();
  document.querySelectorAll('.map-toggle').forEach(input => {
    console.log('Attaching listener to:', input.id); //Debugging on Console
    input.addEventListener('change', () => {
      const key = input.dataset.layer;
      const checked = input.checked;
      const layerId = subparameterLayers[key];
      if (!layerId) return;

      console.log('Toggling layer:', key, layerId, checked); //Debugging on Console

      // Special handling for flood points
      if (key === 'flood') {
        // Only show/hide flood points if choropleth is NOT active
        const choroplethToggle = document.getElementById('toggle-flood-frequency');
        if (!choroplethToggle || !choroplethToggle.checked) {
          map.setLayoutProperty(layerId, 'visibility', checked ? 'visible' : 'none');
        }
      } else {
        map.setLayoutProperty(layerId, 'visibility', checked ? 'visible' : 'none');
      }
      updateCompositeLayer();
      updateExportButtonState();
      syncActiveOverlaysFromSidebar();
    });
  });

  // Handle flood frequency (choropleth) toggle
  const floodFrequencyToggle = document.getElementById('toggle-flood-frequency');
  if (floodFrequencyToggle) {
    floodFrequencyToggle.addEventListener('change', async (e) => {
      const map = getMap();
      const selectedState = document.getElementById('location-select')?.value;
      if (e.target.checked) {
        await showFloodCountChoropleth(window.activeBoundaryType || 'state', selectedState);
        if (map.getLayer('flood-layer')) {
          map.setLayoutProperty('flood-layer', 'visibility', 'none');
        }
      } else {
        if (map.getLayer('flood-choropleth')) map.removeLayer('flood-choropleth');
        if (map.getSource('flood-choropleth')) map.removeSource('flood-choropleth');
        // Only show flood points if their toggle is checked
        const floodPointsToggle = document.getElementById('toggle-flood');
        if (floodPointsToggle && floodPointsToggle.checked && map.getLayer('flood-layer')) {
          map.setLayoutProperty('flood-layer', 'visibility', 'visible');
        }
      }
      updateExportButtonState();
    });
  }
}

export function setupSidebarUI() {
  const sidebarExpand = document.getElementById('sidebar-expand');
  if (!sidebarExpand) {
    console.warn('Sidebar container not found. Delaying setup.');
    return;
  }

  console.log('setupSidebarUI is running...');

  icons.forEach(({ id, panel }) => {
  const icon = document.getElementById(id);
  if (!icon) return;
    icon.addEventListener('click', () => {
      // Remove 'selected' from all icons
      icons.forEach(({ id }) => {
        const otherIcon = document.getElementById(id);
        if (otherIcon) otherIcon.classList.remove('selected');
      });
      // Add 'selected' to the clicked icon
      icon.classList.add('selected');

      if (locked && expanded === panel) {
        unlockPanel();
      } else {
        lockPanel(panel);
      }
    });
  });

  sidebarExpand.addEventListener('mouseleave', () => {
    if (!locked) hidePanel();
  });

  try {
    populateLocationDropdown();
  } catch (err) {
    console.error('Failed to populate dropdown:', err);
  }

  // Attach export button logic
  const exportBtn = document.getElementById('download-map');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportVisibleMap);
  }
}

async function showFloodCountChoropleth(boundaryType, selectedState) {
  const map = getMap();
  const boundaryFile = BOUNDARY_FILE_MAP[boundaryType] || BOUNDARY_FILE_MAP['state'];
  const labelProp = LABEL_PROP_MAP[boundaryType] || 'state';

  // Load boundary polygons
  const boundaryRes = await fetch(boundaryFile);
  let boundaryGeoJson = await boundaryRes.json();

  // Filter to selected state
  if (selectedState) {
    boundaryGeoJson.features = boundaryGeoJson.features.filter(
      f => f.properties.state === selectedState
    );
  }

  // Load flood points
  const floodRes = await fetch('static/data/flood_data.geojson');
  let floodGeoJson = await floodRes.json();

  // Add counts
  const counted = addFloodCountsToPolygons(boundaryGeoJson, floodGeoJson);
  // Show choropleth
  showFloodChoropleth(map, counted, labelProp);

  // Hide flood points
  if (map.getLayer('flood-layer')) {
    map.setLayoutProperty('flood-layer', 'visibility', 'none');
  }
}
