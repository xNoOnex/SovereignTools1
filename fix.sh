echo "=== Directory Check ==="
pwd
git remote -v

echo "=== Locating Landing Page Files ==="
TARGET_FILE=$(grep -rli --exclude-dir={node_modules,.git,dist,build} "Your data. Your device" . 2>/dev/null | head -n 1)

if [ -z "$TARGET_FILE" ]; then
  TARGET_FILE=$(grep -rli --exclude-dir={node_modules,.git,dist,build} "Reserve your download" . 2>/dev/null | head -n 1)
fi

if [ -n "$TARGET_FILE" ]; then
  echo "[+] Found landing page file: $TARGET_FILE"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    let c = fs.readFileSync(file, "utf8");

    c = c.replace(/DIRECT RELEASE & UPDATES/gi, "DIRECT RELEASE & UPDATES");
    c = c.replace(/Get Sovereign Tools/gi, "Get Sovereign Tools");
    c = c.replace(/The Google Play destination will be added here when it is ready\.[^"<]*/gi, "Download the standalone APK or sign up to get direct deployment alerts.");

    const replacement = `
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "420px", margin: "16px auto 0" }}>
      <a href="https://github.com/xNoOnex/SovereignTools1/releases/latest" target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "14px", fontWeight: "bold", fontFamily: "monospace", textTransform: "uppercase", background: "#00ffcc", color: "#000", textDecoration: "none", borderRadius: "2px" }}>
        DOWNLOAD APK ↗
      </a>
      <form action="https://formsubmit.co/xNoOnex@dnmx.cc" method="POST" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px", borderTop: "1px solid #222" }}>
        <input type="hidden" name="_subject" value="New Sovereign Tools Release Alert" />
        <input type="hidden" name="_captcha" value="false" />
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(0, 255, 204, 0.7)", textTransform: "uppercase" }}>Get Notified on New Builds</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="email" name="email" placeholder="operator@network.io" required style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#fff", padding: "8px 12px", fontSize: "13px", fontFamily: "monospace", outline: "none" }} />
          <button type="submit" style={{ background: "#222", border: "1px solid rgba(0, 255, 204, 0.4)", color: "#00ffcc", padding: "8px 16px", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>NOTIFY</button>
        </div>
      </form>
    </div>
    `;

    if (/<button[^>]*>[\s\S]*?DOWNLOAD APK[\s\S]*?<\/button>/i.test(c)) {
      c = c.replace(/<button[^>]*>[\s\S]*?DOWNLOAD APK[\s\S]*?<\/button>/i, replacement);
    } else {
      c = c.replace(/DOWNLOAD APK/g, "DOWNLOAD APK");
    }

    fs.writeFileSync(file, c, "utf8");
    console.log("[✓] File patched successfully.");
  ' "$TARGET_FILE"

  git add "$TARGET_FILE"
  git commit -m "Add direct APK link and FormSubmit alert to xNoOnex@dnmx.cc"
  git push origin $(git branch --show-current)
  echo "[✓] Pushed to GitHub."
else
  echo "[-] Website text not found in $(pwd)."
  echo "Scanning home directory (~)..."
  grep -rli --exclude-dir={node_modules,.git,dist,build} "Your data. Your device" ~ 2>/dev/null
fi
