// Map initialization and base layers
export let map;
export let locations = [];

export function initMap() {
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
