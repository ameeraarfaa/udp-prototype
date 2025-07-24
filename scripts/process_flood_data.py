import pandas as pd
import json
import os
import glob

input_folder = 'data/flood/'
output_path = 'static/data/flood_data.geojson'

# Find all CSV files in the input folder
csv_files = glob.glob(os.path.join(input_folder, '*.csv'))

dfs = []
for file in csv_files:
    print(f"Processing file: {file}") # Terminal log for each file processed (debugging)
    df = pd.read_csv(file)
    df.columns = df.columns.str.strip()
    year = os.path.splitext(os.path.basename(file))[0][-4:]  # Extract year from filename
    df['year'] = year
    dfs.append(df)

if not dfs:
    print("No CSV files found in", input_folder)
    exit(1)

# Combine all data
df = pd.concat(dfs, ignore_index=True)

# Rename columns to consistent names
df = df.rename(columns={
    'DATE': 'Date',
    'LOCATION': 'Location',
    'LATITTUDE (NORTH)': 'Latitude',
    'LONGITUDE (EAST)': 'Longitude',
    'MAXIMUM DEPTH (M)': 'Maximum Depth(m)'
})

def extract_avg_depth(depth_str):
    try:
        parts = depth_str.split('-')
        parts = [float(p) for p in parts]
        return sum(parts) / len(parts)
    except:
        return None

df['avg_depth'] = df['Maximum Depth(m)'].apply(extract_avg_depth)
df = df.dropna(subset=['Latitude', 'Longitude', 'avg_depth'])

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
            "year": row['year'],
            "depth_range": row['Maximum Depth(m)'],
            "avg_depth": row['avg_depth']
        }
    }
    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(geojson, f, indent=2)

print(f"GeoJSON saved to {output_path} with {len(features)} features.")