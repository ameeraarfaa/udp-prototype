// Sidebar UI and event handlers
import { map, locations } from './map-init.js';
import { subparameterLayers, updateCompositeLayer, updateExportButtonState } from './layer-controls.js';

export function buildSidebar() {
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
        <!-- Economic, Infrastructure, Community, Social omitted for brevity -->
      </div>
    </div>
    <button id="download-map" class="btn btn-secondary w-100 mt-4" disabled> Export Map (.jpeg)</button>
  `;

  document.getElementById("location-select").addEventListener("change", (e) => {
    const selected = locations.find(loc => loc.name === e.target.value);
    if (selected) map.setView(selected.center, selected.zoom);
  });

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
}
