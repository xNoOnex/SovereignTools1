const fs = require('fs');
const xml2js = require('xml2js');
const path = 'android/app/src/main/AndroidManifest.xml';

const parser = new xml2js.Parser();
const builder = new xml2js.Builder();

fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error("Failed to read Manifest:", err);
    return;
  }
  
  parser.parseString(data, (err, result) => {
    if (err) {
      console.error("Failed to parse XML:", err);
      return;
    }

    let manifest = result.manifest;
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // Check if it already exists to prevent duplicates
    const exists = manifest['uses-permission'].some(
      p => p['$'] && p['$']['android:name'] === 'moe.shizuku.manager.permission.API_V23'
    );

    if (!exists) {
      manifest['uses-permission'].push({
        '$': {
          'android:name': 'moe.shizuku.manager.permission.API_V23'
        }
      });
      
      const newXml = builder.buildObject(result);
      fs.writeFileSync(path, newXml);
      console.log("SUCCESS: Shizuku permission injected as strict XML node.");
    } else {
      console.log("NOTICE: Permission already locked in XML.");
    }
  });
});
