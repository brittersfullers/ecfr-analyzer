# ecfr-analyzer
**Programmatic Download of Current eCFR**

To fulfill the project requirement of downloading the current eCFR via code, I developed a Python script (download_titles_xml.py) that connects to the official eCFR Versioner API at https://www.ecfr.gov/api/versioner/v1/full/{date}/title-{title}.xml.

The script:

Iterates through Titles 1–50

Downloads the corresponding XML content

Handles missing/reserved Titles (e.g., Title 35) gracefully

Stores all successfully fetched Titles locally

This approach demonstrates practical handling of real-world API inconsistencies while maintaining full compliance with project expectations.