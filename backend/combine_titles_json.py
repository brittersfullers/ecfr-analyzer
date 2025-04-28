import os
import json

# Path to your JSON titles folder
json_folder = "json_titles"

# Where to save the combined file
output_file = "ecfr_combined.json"

# Container for all title data
all_titles = []

# Go through each JSON file in the folder
for filename in sorted(os.listdir(json_folder)):
    if filename.endswith(".json"):
        filepath = os.path.join(json_folder, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                title_data = json.load(f)
                all_titles.append(title_data)
                print(f"✅ Loaded {filename}")
            except Exception as e:
                print(f"❌ Failed to load {filename}: {e}")

# Save all titles combined into one JSON file
with open(output_file, "w", encoding="utf-8") as out_f:
    json.dump(all_titles, out_f, indent=2)

print(f"\n🎯 Successfully combined {len(all_titles)} Titles into {output_file}")
