// map.js
export let map;
export let locations = [];

const API_KEY = "YOUR_MAPTILER_API_KEY"; // Replace with your real key

const baseLayers = {
  "Default Style": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }),

  "Contours Style": L.tileLayer(`https://api.maptiler.com/tiles/contours-v2/{z}/{x}/{y}.pbf?key=TgrDzodq8E10HppJIC77`, {
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
    maxZoom: 20,
  }),

};

export function initMap() {
  map = L.map("map", {
    center: [3.14, 101.69],
    zoom: 12,
    zoomControl: true,
    layers: [baseLayers["MapTiler Streets"]], // Default layer
  });

  // Add layer switcher
  L.control.layers(baseLayers).addTo(map);
}
