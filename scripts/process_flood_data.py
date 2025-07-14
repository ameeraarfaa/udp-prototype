import pandas as pd
import json
import os

df = pd.read_csv('../data/kl_flood_data.csv')

# Clean column names just in case
df.columns = df.columns.str.strip()

# Print columns to verify
print("📄 Columns in the data:", df.columns.tolist())

# Rename columns to consistent names (optional)
df = df.rename(columns={
    'DATE': 'Date',
    'LOCATION': 'Location',
    'LATITTUDE (NORTH)': 'Latitude',
    'LONGITUDE (EAST)': 'Longitude',
    'MAXIMUM DEPTH (M)': 'Maximum Depth(m)'
})

# Function to calculate average from range
def extract_avg_depth(depth_str):
    try:
        parts = depth_str.split('-')
        parts = [float(p) for p in parts]
        return sum(parts) / len(parts)
    except:
        return None

# Apply to create new column
df['avg_depth'] = df['Maximum Depth(m)'].apply(extract_avg_depth)

# Drop rows with missing data
df = df.dropna(subset=['Latitude', 'Longitude', 'avg_depth'])

# Create GeoJSON features
features = []
for _, row in df.iterrows():
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [row['Longitude'], row['Latitude']]
        },
        "properties": {
            "location": row['Location'],
            "date": row['Date'],
            "depth_range": row['Maximum Depth(m)'],
            "avg_depth": row['avg_depth']
        }
    }
    features.append(feature)

# Wrap and write GeoJSON
geojson = {
    "type": "FeatureCollection",
    "features": features
}

output_path = '../data/flood_data.geojson'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w') as f:
    json.dump(geojson, f, indent=2)

print(f"✅ GeoJSON saved to {output_path} with {len(features)} features.")
