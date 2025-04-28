import requests
import os
import time

# Create a folder to store the downloaded XML files
if not os.path.exists("xml_titles"):
    os.makedirs("xml_titles")

# Base date for the snapshot we want
date = "2024-01-01"

# Loop through Titles 1 to 50
for title_num in range(1, 51):
    # Build the correct URL
    url = f"https://www.ecfr.gov/api/versioner/v1/full/{date}/title-{title_num}.xml"
    print(f"Downloading Title {title_num} from {url}")

    try:
        response = requests.get(url)
        if response.status_code == 200:
            # Save the file
            filename = f"xml_titles/title-{title_num}.xml"
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Successfully downloaded Title {title_num}")
        else:
            print(f"❌ Failed to download Title {title_num} — Status Code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error downloading Title {title_num}: {e}")

    time.sleep(1)  # Be polite to the server
