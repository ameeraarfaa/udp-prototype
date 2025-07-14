import folium
import json
from pathlib import Path

# Load updated flood GeoJSON
with open('../data/flood_data.geojson') as f:
    flood_data = json.load(f)

# Create base map centered on Kuala Lumpur
m = folium.Map(location=[3.14, 101.69], zoom_start=12)

# Add flood depth markers
flood_layer = folium.FeatureGroup(name="Flood Depth")
for feature in flood_data['features']:
    coord = feature['geometry']['coordinates']
    props = feature['properties']
    depth = props['avg_depth']
    popup = f"{props['location']}<br>Date: {props['date']}<br>Depth: {props['depth_range']} m"
    
    folium.CircleMarker(
        location=[coord[1], coord[0]],  # [lat, lon]
        radius=5 + depth * 5,
        color='blue',
        fill=True,
        fill_opacity=0.6,
        popup=popup
    ).add_to(flood_layer)
flood_layer.add_to(m)

# Add LST image overlay (you can adjust the bounds if needed)
lst_image = '../output/lst_overlay.png'
bounds = [[3.1214, 101.6771], [3.1744, 101.7228]]  # Make sure this matches your raster coverage

folium.raster_layers.ImageOverlay(
    name="Land Surface Temperature",
    image=lst_image,
    bounds=bounds,
    opacity=0.5,
).add_to(m)

# Add layer toggle control
folium.LayerControl().add_to(m)

# Save to HTML
output_path = '../output/map.html'
Path(output_path).parent.mkdir(parents=True, exist_ok=True)
m.save(output_path)
print(f"✅ Map saved to {output_path}")
