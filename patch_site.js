const fs = require('fs');
const path = require('path');

function findTargetFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findTargetFiles(fullPath, fileList);
      }
    } else if (/\.(jsx?|tsx?|html)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = findTargetFiles('./src');
let modified = false;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('Reserve your download link') || content.includes('NOTIFY ME WHEN READY')) {
    console.log(`[+] Patching download & notify section in: ${file}`);

    // Update section titles
    content = content.replace(/FUTURE DOWNLOAD LINK/gi, 'DIRECT RELEASE & UPDATES');
    content = content.replace(/Reserve your download link/gi, 'Get Sovereign Tools');
    content = content.replace(
      /The Google Play destination will be added here when it is ready\.[^"<]*/gi,
      'Download the standalone APK or sign up to get direct deployment alerts.'
    );

    // Component markup providing both Direct Download and FormSubmit notification to xNoOnex@dnmx.cc
    const replacementJSX = `
      <div className="flex flex-col gap-5 w-full max-w-md mx-auto mt-4">
        <a 
          href="https://github.com/xNoOnex/SovereignTools1/releases/latest" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full text-center py-3.5 px-6 font-mono font-bold tracking-wider uppercase text-black bg-[#00ffcc] hover:bg-[#00ddb0] transition-colors rounded-sm shadow-md flex items-center justify-center gap-2"
        >
          DOWNLOAD APK ↗
        </a>

        <form 
          action="https://formsubmit.co/xNoOnex@dnmx.cc" 
          method="POST" 
          className="flex flex-col gap-2 w-full pt-4 border-t border-[#222]"
        >
          <input type="hidden" name="_subject" value="New Sovereign Tools Release Alert Subscriber" />
          <input type="hidden" name="_captcha" value="false" />
          <span className="text-xs font-mono tracking-widest text-[#00ffcc]/70 uppercase">Get Notified on New Builds</span>
          <div className="flex gap-2">
            <input 
              type="email" 
              name="email" 
              placeholder="operator@network.io" 
              required 
              className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm font-mono focus:border-[#00ffcc] outline-none flex-grow rounded-sm"
            />
            <button 
              type="submit" 
              className="bg-[#222] border border-[#00ffcc]/40 text-[#00ffcc] px-4 py-2 text-xs font-mono font-bold tracking-wider hover:bg-[#00ffcc]/10 transition-colors uppercase rounded-sm"
            >
              NOTIFY
            </button>
          </div>
        </form>
      </div>
    `;

    // Replace the button block
    const buttonRegex = /<button[^>]*>[\s\S]*?NOTIFY ME WHEN READY[\s\S]*?<\/button>/gi;
    if (buttonRegex.test(content)) {
      content = content.replace(buttonRegex, replacementJSX);
    } else {
      content = content.replace(/NOTIFY ME WHEN READY/g, 'DOWNLOAD APK');
    }

    fs.writeFileSync(file, content, 'utf8');
    modified = true;
    break;
  }
}

if (!modified) {
  console.log('[-] Target phrase not matched. Checking exact keywords...');
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Reserve your download') || content.includes('DOWNLOAD')) {
      console.log(`[!] Inspect potential candidate file: ${file}`);
    }
  }
}
