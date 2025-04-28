import json
import os

# Load the combined full JSON
input_file = "ecfr_combined.json"

# Output small summary file
output_file = "small_summary.json"

# Storage for the summarized results
summary_data = []

# Load the full dataset
with open(input_file, "r", encoding="utf-8") as f:
    all_titles = json.load(f)

# Helper function to recursively process sections
def process_node(node, title_number):
    entry = {}
    
    if "type" in node:
        entry["type"] = node["type"]
    
    if "label" in node:
        entry["label"] = node["label"]
    
    if "identifier" in node:
        entry["identifier"] = node["identifier"]
    
    if "description" in node:
        entry["description"] = node["description"]
    
    # Simple word count on description
    if "description" in node and node["description"]:
        entry["word_count"] = len(node["description"].split())
    else:
        entry["word_count"] = 0
    
    entry["title_number"] = title_number

    summary_data.append(entry)

    # Recursively process children (if any)
    if "children" in node:
        for child in node["children"]:
            process_node(child, title_number)

# Loop through all Titles
for title in all_titles:
    title_number = None

    if "label" in title:
        # Extract Title number (e.g., "Title 1 - General Provisions")
        parts = title["label"].split()
        if len(parts) > 1 and parts[0].lower() == "title":
            title_number = parts[1]

    if "children" in title:
        for child in title["children"]:
            process_node(child, title_number)

# Save the summarized file
with open(output_file, "w", encoding="utf-8") as out_f:
    json.dump(summary_data, out_f, indent=2)

print(f"🎯 Successfully parsed and summarized {len(summary_data)} nodes into {output_file}")
