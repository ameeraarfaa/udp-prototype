# Urban Data Platform Climate Prototype

## Overview
This project is a modular web application for visualizing urban climate and flood data in Kuala Lumpur. It uses Leaflet.js for interactive mapping and supports config-driven layer management for easy extensibility.

## Project Structure
```
udp-climate-prototype/
├── data/                # Raw data files (CSV, etc.)
├── output/              # Generated images/overlays
├── scripts/             # Python scripts for data processing
├── static/
│   ├── css/
│   ├── js/              # Modular JavaScript files
│   └── data/            # Processed data (GeoJSON, config)
├── map.html             # Main HTML file
├── requirements.txt     # Python dependencies
├── generate_data.bat    # Batch file to automate data processing
└── README.md            # Project documentation
```

## Setup & Usage

### 1. Install Python dependencies
```
pip install -r requirements.txt
```

### 2. Process Data
Run the batch file to generate processed data (GeoJSON, etc.):
```
generate_data.bat
```
This will run all necessary Python scripts in the `scripts/` folder and output files to `static/data/`.

### 3. Start the Web Server
Serve the project using your preferred static server or framework (Flask, Django, etc.). Ensure the `static/` folder is accessible.

### 4. Open the App
Open `map.html` in your browser. The map and sidebar will load dynamically from config and data files.

## Layer Management
Layers are defined in `static/data/layers-config.json`. You can add, remove, or modify layers by editing this file. Supported types:
- `geojson`: Loads points from a GeoJSON file
- `image`: Loads an image overlay
- `rectangle`: Draws a rectangle overlay

Example config entry:
```
{
  "key": "flood",
  "type": "geojson",
  "source": "static/data/flood_data.geojson",
  "label": "Flood",
  "color": "blue"
}
```

## Modular JavaScript
- `map-init.js`: Map initialization
- `layer-controls.js`: Layer logic (config-driven)
- `sidebar.js`: Sidebar UI and event handlers
- `export.js`: Map export functionality
- `main.js`: Entry point, coordinates initialization

## Error Handling
- If data files are missing or fail to load, user-friendly errors are shown in the browser console and UI.
- Always run `generate_data.bat` after updating raw data.

## Extending the App
- Add new layers by editing `layers-config.json`.
- Add new data processing scripts to `scripts/` and update the batch file.
- Modular JS makes it easy to add new UI features or layer types.
