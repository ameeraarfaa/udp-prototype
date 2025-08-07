// sidebar.js
import { getMap, getLocations, flyToLocation, setBaseMapStyle, populateLocationDropdown } from './map-init.js';
import { subparameterLayers, updateCompositeLayer, updateExportButtonState } from './layer-controls.js';
import { exportVisibleMap } from './export.js';
import { addFloodCountsToPolygons, showFloodChoropleth } from './choropleth.js';
import { renderActiveLayersPanel, syncActiveOverlaysFromSidebar } from './active-layers.js';
import { normaliseProperties } from './boundaryNormaliser.js';

// Maps UI boundary labels to internal type keys
const BOUNDARY_LABEL_TO_TYPE = {
  'State': 'state',
  'District': 'district',
  'Subdistrict': 'subdistrict',
  'Parliament': 'parlimen',
  'State Legislative Assembly (DUN)': 'dun'
};

// The order and labels to display in the boundaries UI section
const boundaryLabels = Object.keys(BOUNDARY_LABEL_TO_TYPE);

// Maps internal type keys to their GeoJSON file paths
const BOUNDARY_FILE_MAP = {
  state: 'data/boundaries/State_MY.json',
  district: 'data/boundaries/District_MY.json',
  subdistrict: 'data/boundaries/Subdistrict_MY.json',
  parlimen: 'data/boundaries/Parliament_MY.json',
  dun: 'data/boundaries/DUN_Peninsular_MY.json'
};

// Maps internal type keys to the property name used for popups/labels in GeoJSON 
const LABEL_PROP_MAP = {
  state: 'state',
  district: 'district',
  subdistrict: 'subdistrict',
  parlimen: 'parlimen',
  dun: 'dun'
};

const BOUNDARY_LAYER_DISABLE_CONFIG = {
  dun: {
    states: [
      'Wilayah Persekutuan Kuala Lumpur',
      'Wilayah Persekutuan Labuan',
      'Wilayah Persekutuan Putrajaya',
      'Sabah',
      'Sarawak'
    ],
    messages: {
      'Wilayah Persekutuan Kuala Lumpur': "No DUN boundaries for federal territories.",
      'Wilayah Persekutuan Labuan': "No DUN boundaries for federal territories.",
      'Wilayah Persekutuan Putrajaya': "No DUN boundaries for federal territories.",
      'Sabah': "DUN boundaries not available for Sabah yet.",
      'Sarawak': "DUN boundaries not available for Sarawak yet."
    }
  },
  district: {
    states: [
      'Perlis',
      'Wilayah Persekutuan Kuala Lumpur',
      'Wilayah Persekutuan Labuan',
      'Wilayah Persekutuan Putrajaya',
    ],
    messages: {
      'Perlis': "No district boundaries for Perlis.",
      'Wilayah Persekutuan Kuala Lumpur': "No district boundaries for federal territories.",
      'Wilayah Persekutuan Labuan': "No district boundaries for federal territories.",
      'Wilayah Persekutuan Putrajaya': "No district boundaries for federal territories.", 
    }
  },
  subdistrict: {
    states: ['Wilayah Persekutuan Putrajaya'],
    messages: {'Wilayah Persekutuan Putrajaya': "No subdistrict boundaries for Putrajaya."}
  }
};

window.activeBoundaryType = 'state'; // Tracks active boundary type

const icons = [
  { id: 'icon-general', panel: 'general' },
  { id: 'icon-layers', panel: 'layers' },
  { id: 'icon-account', panel: 'account' },
  { id: 'icon-active-layers', panel: 'active-layers' },
  { id: 'icon-about', panel: 'about' }
];

let expanded = null;
let locked = false;

function getPanelContent(panel) {
  if (panel === 'general') {

    // Debugging logs
    console.log('🔍 Building general panel with state:', window.sidebarState);
    console.log('🔍 Current location in state:', window.sidebarState?.location);
    console.log('🔍 Available locations:', getLocations()?.map(l => l.name));

    return `
      <h5>Map Settings</h5>
      <div class="mb-3">
        <label class="form-label">Base Map Style</label>
        <div class="row g-2 mb-3" id="base-style-cards">
          ${window.BASE_STYLES?.map(style => `
            <div class="col-6">
              <div class="card base-style-card ${window.sidebarState.baseStyle === style.url ? 'selected' : ''}" 
                   data-style-url="${style.url}" role="button">
                <img src="${style.thumbnail || 'static/images/map-thumbnails/' + style.id + '.jpg'}" 
                     class="card-img-top" alt="${style.name}" 
                     onerror="this.src='static/images/map-thumbnails/default.jpg'">
                <div class="card-body p-2 text-center">
                  <small class="card-title mb-0">${style.name}</small>
                </div>
              </div>
            </div>
          `).join('') ?? ''}
        </div>

        <label class="form-label">Location</label>
        <select id="location-select" class="form-select mb-2">
          <option value="Select..." ${window.sidebarState.location === 'Select...' ? 'selected' : ''}>Select...</option>
          ${getLocations().map(loc => `
            <option value="${loc.name}" ${window.sidebarState.location === loc.name ? 'selected' : ''}>
              ${loc.name}
            </option>
          `).join('')}
        </select>

        <label class="form-label mt-3">Boundaries</label>
        <div id="boundary-toggles" class="mb-2">
          ${boundaryLabels.map(label => {
            const boundaryType = BOUNDARY_LABEL_TO_TYPE[label];
            const isChecked = window.sidebarState.boundaries[boundaryType] || false;
            return `
              <div class="form-switch mb-2">
                <input class="form-check-input boundary-toggle" type="checkbox" role="switch"
                       id="boundary-${boundaryType}" data-type="${boundaryType}"
                       ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="boundary-${boundaryType}">${label}</label>
              </div>
            `;
          }).join('')}
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
              <button class="accordion-button collapsed" type="button" onclick="toggleAccordion('climate-collapse', this)">
                <span class="text-muted me-2" title="Climate indicators">🛈</span> Climate
              </button>
            </h2>
            <div id="climate-collapse" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="mb-2">
                  <div class="fw-bold">Flood</div>
                  <div class="form-check ms-3">
                    <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood" data-layer="flood"
                          ${window.sidebarState.layers.flood ? 'checked' : ''} />
                    <label class="form-check-label" for="toggle-flood">Flood Points</label>
                  </div>
                  <div class="form-check ms-3">
                    <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood-frequency" data-layer="flood-frequency"
                          ${window.sidebarState.layers['flood-frequency'] ? 'checked' : ''} />
                    <label class="form-check-label" for="toggle-flood-frequency">Flood Frequency</label>
                  </div>
                  <div class="form-check ms-3">
                    <input class="form-check-input map-toggle" type="checkbox" id="toggle-flood-density" data-layer="flood-density"
                          ${window.sidebarState.layers['flood-density'] ? 'checked' : ''} />
                    <label class="form-check-label" for="toggle-flood-density">Flood Density</label>
                  </div>
                </div>
                <div class="mb-2">
                  <div class="fw-bold">Land Surface Temperature</div>
                  <div class="form-check ms-3">
                    <input class="form-check-input map-toggle" type="checkbox" id="toggle-lst" data-layer="lst"
                          ${window.sidebarState.layers.lst ? 'checked' : ''} />
                    <label class="form-check-label" for="toggle-lst">LST Heatmap</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Environment Accordion -->
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" onclick="toggleAccordion('environment-collapse', this)">
                <span class="text-muted me-2" title="Environmental indicators">🛈</span> Environment
              </button>
            </h2>
            <div id="environment-collapse" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="text-muted">
                  <p>Environmental subparameters to be added here.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Economy Accordion -->
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" onclick="toggleAccordion('economy-collapse', this)">
                <span class="text-muted me-2" title="Economic indicators">🛈</span> Economy
              </button>
            </h2>
            <div id="economy-collapse" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="text-muted">
                  <p>Economic subparameters to be added here.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Accordion -->
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" onclick="toggleAccordion('social-collapse', this)">
                <span class="text-muted me-2" title="Social indicators">🛈</span> Social
              </button>
            </h2>
            <div id="social-collapse" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="text-muted">
                  <p>Social subparameters to be added here.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Population Accordion -->
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" onclick="toggleAccordion('population-collapse', this)">
                <span class="text-muted me-2" title="Population indicators">🛈</span> Population
              </button>
            </h2>
            <div id="population-collapse" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="text-muted">
                  <p>Population subparameters to be added here.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        <button id="download-map" class="btn btn-secondary w-100 mt-4" disabled>Export Map (.jpeg)</button>
      </div>
    `;
  }

  if (panel === 'Account') {
    return `<h5>Account</h5><div class="text-muted">No account options yet.</div>`;
  }

  if (panel === 'about') {
    return `
      <h5>About the Project</h5>
      <div class="text-muted">
        <p>This platform aims to visualise climate risk and vulnerability across Malaysia in an interactive and accessible way. Targeted at both the general public and Think City’s partners and potential clients, it leverages geospatial data and intuitive UI to make complex environmental data actionable.
</p>
      </div>
    `;
  }

  return '';

}

function showPanel(panel) {
  const sidebarExpand = document.getElementById('sidebar-expand');
  sidebarExpand.classList.add('expanded');
  sidebarExpand.innerHTML = getPanelContent(panel);

  if (panel === 'general') {
    attachGeneralListeners();
    //populateLocationDropdown();
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

  // Base Style Selection
  document.querySelectorAll('.base-style-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const styleUrl = e.currentTarget.dataset.styleUrl;
      
      // Remove selected class from all cards
      document.querySelectorAll('.base-style-card').forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked card
      e.currentTarget.classList.add('selected');
      
      // Update state and apply style
      window.sidebarState.baseStyle = styleUrl;
      setBaseMapStyle(styleUrl);
    });
  });

  //Location Selection
  document.getElementById('location-select')?.addEventListener('change', async (e) => {
    const selectedState = e.target.value;
    window.sidebarState.location = selectedState; // Save to state
    
    if (selectedState && selectedState !== 'Select...') {
      flyToLocation(selectedState);
      await updateBoundaryLayersForState(selectedState);

      //Boundary Toggles
      document.querySelectorAll('.boundary-toggle').forEach(toggle => {
        const type = toggle.dataset.type;
        const label = document.querySelector(`label[for="boundary-${type}"]`);
        const config = BOUNDARY_LAYER_DISABLE_CONFIG[type];
        if (config && config.states.includes(selectedState)) {
          toggle.disabled = true;
          toggle.checked = false;
          // Clear from state when disabled
          window.sidebarState.boundaries[type] = false;
          const msg = config.messages[selectedState] || "Boundary not available for this state.";
          toggle.title = msg;
          if (label) label.title = msg;
        } else {
          toggle.disabled = false;
          toggle.title = "";
          if (label) label.title = "";
        }
      });
    }
  });

  document.querySelectorAll('.boundary-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const type = e.target.dataset.type;
      const checked = e.target.checked;
      const state = document.getElementById('location-select')?.value;
      const map = getMap();

      // Save to state
      window.sidebarState.boundaries[type] = checked;
      
      // Clear other boundary states when one is selected
      if (checked) {
        Object.keys(window.sidebarState.boundaries).forEach(key => {
          if (key !== type) window.sidebarState.boundaries[key] = false;
        });
      }

      // Always remove all boundary layers before adding a new one
      Object.keys(BOUNDARY_LABEL_TO_TYPE).forEach(label => {
        const boundaryType = BOUNDARY_LABEL_TO_TYPE[label];
        const sourceId = `boundary-source-${boundaryType}`;
        const layerId = `boundary-layer-${boundaryType}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });

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
          await showFloodCountChoropleth(type, state);
        }
      }
    });

    // Show tooltip on disabled toggle click
    toggle.addEventListener('click', (e) => {
      if (e.target.disabled && e.target.title) {
        alert(e.target.title);
        e.preventDefault();
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

export function attachLayerPanelListeners() {
  console.log('Attaching layer panel listeners...');
  
  // Remove any existing listeners first to prevent duplicates
  document.querySelectorAll('.map-toggle').forEach(toggle => {
    const clone = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(clone, toggle);
  });

  // Attach new listeners
  document.querySelectorAll('.map-toggle').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const layerKey = e.target.dataset.layer;
      const layerId = `${layerKey}-layer`;
      const map = getMap();
      
      // Save to state
      window.sidebarState.layers[layerKey] = e.target.checked;
      
      console.log('🔘 Toggle changed:', {
        layerKey,
        layerId,
        checked: e.target.checked,
        layerExists: !!map.getLayer(layerId)
      });

      if (map.getLayer(layerId)) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty(layerId, 'visibility', visibility);
        console.log('Set visibility to:', visibility, 'for layer:', layerId);
        
        // Update export button and active layers
        updateExportButtonState();
        syncActiveOverlaysFromSidebar();
      } else {
        console.error('Layer not found:', layerId);
      }
    });
  });
  
  console.log('Layer panel listeners attached to', document.querySelectorAll('.map-toggle').length, 'toggles');
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
    const matchState = STATE_NAME_MAP[selectedState] || selectedState;
    filtered = geojson.features.filter(
      f => normaliseProperties('state', f.properties).name === matchState
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

// Toggle accordion function for sidebar
window.toggleAccordion = function(collapseId, buttonElement) {
  const collapseElement = document.getElementById(collapseId);
  const isCurrentlyOpen = collapseElement.classList.contains('show');
  
  if (isCurrentlyOpen) {
    // Close the accordion with smooth transition
    collapseElement.style.height = collapseElement.scrollHeight + 'px';
    collapseElement.offsetHeight; // Force reflow
    
    collapseElement.classList.add('collapsing');
    collapseElement.classList.remove('collapse', 'show');
    collapseElement.style.height = '0px';
    
    buttonElement.classList.add('collapsed');
    buttonElement.setAttribute('aria-expanded', 'false');
    
    // After transition completes, clean up classes
    setTimeout(() => {
      collapseElement.classList.remove('collapsing');
      collapseElement.classList.add('collapse');
      collapseElement.style.height = '';
    }, 350); // Bootstrap's default transition duration
    
  } else {
    // Open the accordion with smooth transition
    collapseElement.classList.remove('collapse');
    collapseElement.classList.add('collapsing');
    collapseElement.style.height = '0px';
    
    collapseElement.offsetHeight; // Force reflow
    collapseElement.style.height = collapseElement.scrollHeight + 'px';
    
    buttonElement.classList.remove('collapsed');
    buttonElement.setAttribute('aria-expanded', 'true');
    
    // After transition completes, clean up classes
    setTimeout(() => {
      collapseElement.classList.remove('collapsing');
      collapseElement.classList.add('collapse', 'show');
      collapseElement.style.height = '';
    }, 350); // Bootstrap's default transition duration
  }
};