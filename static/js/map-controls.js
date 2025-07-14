let map; // Declare globally to initialize after locations load
let locations = []; // Will hold data from JSON

// Initialize Map Base
function initMap() {
  map = L.map("map", {
    center: [3.14, 101.69],
    zoom: 12,
    zoomControl: true,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
}

// --- Layers ---
const floodLayer = L.layerGroup([
  L.circleMarker([3.1476, 101.696], {
    radius: 6,
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.6,
  }),
]);

const lstLayer = L.imageOverlay("output/lst_overlay.png", [[3.10, 101.65], [3.18, 101.73]], {
  opacity: 0.5,
});

const waterDistLayer = L.layerGroup([
  L.rectangle([[3.12, 101.67], [3.14, 101.69]], {
    color: "#006400",
    fillOpacity: 0.4,
    weight: 1
  }),
]);

const subparameterLayers = {
  flood: floodLayer,
  lst: lstLayer,
  water: waterDistLayer,
};

let compositeLayer = null;

// Build Sidebar after locations are loaded
function buildSidebar() {
  const sidebar = document.getElementById("sidebar");

  const locationOptions = locations.map(loc =>
    `<option value="${loc.name}">${loc.name}</option>`
  ).join("");

  sidebar.innerHTML = `
    <h5 class="mb-3">Urban Data Platform</h5>

    <div class="mb-3">
      <label for="location-select">Select Location</label>
      <select id="location-select" class="form-select">
        <option disabled selected>Select...</option>
        ${locationOptions}
      </select>
    </div>

    <div id="parameters-section">
      <div class="accordion" id="parameterAccordion">

        <!-- Climate -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#climate-collapse">
              Climate <span class="ms-auto text-muted" title="Data on temperature, flood, and proximity to water bodies.">🛈</span>
            </button>
          </h2>
          <div id="climate-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body">
              <div class="form-check">
                <input class="form-check-input param-toggle" type="checkbox" id="toggle-flood" data-layer="flood" />
                <label class="form-check-label" for="toggle-flood">Flood</label>
              </div>
              <div class="form-check">
                <input class="form-check-input param-toggle" type="checkbox" id="toggle-lst" data-layer="lst" />
                <label class="form-check-label" for="toggle-lst">Land Surface Temp</label>
              </div>
              <div class="form-check">
                <input class="form-check-input param-toggle" type="checkbox" id="toggle-water" data-layer="water" />
                <label class="form-check-label" for="toggle-water">Dist. to Water</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Economic -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#economic-collapse">
              Economic <span class="ms-auto text-muted" title="Coming soon.">🛈</span>
            </button>
          </h2>
          <div id="economic-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted fst-italic">
              Subparameters will appear here.
            </div>
          </div>
        </div>

        <!-- Infrastructure -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#infra-collapse">
              Infrastructure <span class="ms-auto text-muted" title="Coming soon.">🛈</span>
            </button>
          </h2>
          <div id="infra-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted fst-italic">
              Subparameters will appear here.
            </div>
          </div>
        </div>

        <!-- Community -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#community-collapse">
              Community <span class="ms-auto text-muted" title="Coming soon.">🛈</span>
            </button>
          </h2>
          <div id="community-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted fst-italic">
              Subparameters will appear here.
            </div>
          </div>
        </div>

        <!-- Social -->
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#social-collapse">
              Social <span class="ms-auto text-muted" title="Coming soon.">🛈</span>
            </button>
          </h2>
          <div id="social-collapse" class="accordion-collapse collapse" data-bs-parent="#parameterAccordion">
            <div class="accordion-body text-muted fst-italic">
              Subparameters will appear here.
            </div>
          </div>
        </div>

      </div>
    </div>

    <button id="download-map" class="btn btn-secondary w-100 mt-4" disabled>📥 Export Map (.jpeg)</button>
  `;

  // Location handler
  document.getElementById("location-select").addEventListener("change", (e) => {
    const selected = locations.find(loc => loc.name === e.target.value);
    if (selected) map.setView(selected.center, selected.zoom);
  });

  // Layer toggles
  document.querySelectorAll(".param-toggle").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.layer;
      const checked = input.checked;

      if (checked) {
        map.addLayer(subparameterLayers[key]);
      } else {
        map.removeLayer(subparameterLayers[key]);
      }

      updateCompositeLayer();
      updateExportButtonState();
    });
  });

  // Export map
  document.getElementById("download-map").addEventListener("click", exportVisibleMap);
}

function updateCompositeLayer() {
  const flood = document.getElementById("toggle-flood").checked;
  const lst = document.getElementById("toggle-lst").checked;

  if (flood && lst) {
    if (!compositeLayer) {
      compositeLayer = L.rectangle([[3.12, 101.67], [3.17, 101.71]], {
        color: "red",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "red",
        dashArray: "5, 5"
      }).addTo(map);
    }
  } else {
    if (compositeLayer) {
      map.removeLayer(compositeLayer);
      compositeLayer = null;
    }
  }
}

function updateExportButtonState() {
  const anyChecked = [...document.querySelectorAll(".param-toggle")].some(i => i.checked);
  document.getElementById("download-map").disabled = !anyChecked;
}

function exportVisibleMap() {
  html2canvas(document.getElementById("map"), {
    useCORS: true
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "map_view.jpg";
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
  });
}

// Load locations dynamically then init everything
fetch("static/data/locations.json")
  .then(res => res.json())
  .then(data => {
    locations = data;
    initMap();
    buildSidebar();
  })
  .catch(err => {
    console.error("Error loading locations.json:", err);
    alert("Failed to load locations. Please check console.");
  });
