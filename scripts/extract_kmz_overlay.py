from zipfile import ZipFile
from xml.etree import ElementTree as ET
import shutil
from pathlib import Path

kmz_file = Path('../data/KL_2025.kmz')
extract_path = Path('../output/kmz_extract')
extract_path.mkdir(exist_ok=True)

# Extract KMZ
with ZipFile(kmz_file, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

# Parse KML
kml_file = extract_path / 'doc.kml'
tree = ET.parse(kml_file)
root = tree.getroot()
ns = {'kml': 'http://www.opengis.net/kml/2.2'}

ground = root.find('.//kml:GroundOverlay', ns)
icon = ground.find('kml:Icon/kml:href', ns).text
latlon = ground.find('kml:LatLonBox', ns)
north = float(latlon.find('kml:north', ns).text)
south = float(latlon.find('kml:south', ns).text)
east = float(latlon.find('kml:east', ns).text)
west = float(latlon.find('kml:west', ns).text)

# Copy image for use
img_src = extract_path / icon
img_dst = Path('../output/lst_overlay.png')
shutil.copy(img_src, img_dst)

print("✅ LST image and bounds ready.")
print(f"Image: {img_dst}")
print(f"Bounds: [[{south}, {west}], [{north}, {east}]]")
