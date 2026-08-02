import os, json

print("Scanning system packages...")
# Grab all installed Android packages
packages = os.popen("pm list packages").read().split('\n')
pkg_list = [p.replace('package:', '').strip() for p in packages if p.strip()]

# Save to a JSON file for the Debloater module
with open('debloat_data.json', 'w') as f:
    json.dump(pkg_list, f)

print("Scanning local storage for media and APKs...")
found_files = []
# The default Termux storage folder (from termux-setup-storage)
search_dir = "/data/data/com.termux/files/home/storage/shared"

for root, dirs, files in os.walk(search_dir):
    for file in files:
        # Add any file extensions you want the Shredder/Gallery to see here
        if file.endswith(('.jpg', '.png', '.mp4', '.mp3', '.apk', '.txt')):
            found_files.append(os.path.join(root, file))

# Save to a JSON file for the Gallery/Audio/Shredder modules
with open('storage_data.json', 'w') as f:
    json.dump(found_files, f)

print("Scan complete! Data is ready for Sovereign Tools.")
