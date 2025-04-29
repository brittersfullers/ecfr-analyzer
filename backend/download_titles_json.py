import requests
import os
import time

# Create a folder if it doesn't exist
if not os.path.exists("json_titles"):
    os.makedirs("json_titles")

# Loop through Titles 1 to 50
for title_num in range(1, 51):
    url = f"https://www.ecfr.gov/api/versioner/v1/structure/current/title-{title_num}.json"
    print(f"Downloading Title {title_num} from {url}")

    try:
        response = requests.get(url)
        if response.status_code == 200:
            filename = f"json_titles/title-{title_num}.json"
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Successfully downloaded Title {title_num}")
        else:
            print(f"❌ Failed to download Title {title_num} — Status Code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error downloading Title {title_num}: {e}")

    time.sleep(1)  # Be polite to the server
