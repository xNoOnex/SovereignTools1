# 🛡️ Sovereign Tools

**A self-contained, offline-first digital survival kit for Android.**

Sovereign Tools is an all-in-one, privacy-hardened toolkit designed to give you complete control over your data, communications, and hardware. Designed to operate completely off-grid, it features a localized WebRTC mesh network, military-grade encryption, and hardware-level root control via Shizuku.

**Built entirely on a smartphone.** 
In the true spirit of decentralization and mobile sovereignty, this entire application was coded, compiled, and deployed directly on an Android device using Termux. No desktop PC was used to build this infrastructure.

## ⚙️ Core Architecture

Sovereign Tools operates on a strictly offline-first philosophy. No cloud sync, no telemetry, no tracking. 

* **Dual-Mode UI:** Features a "Basic" mode for everyday privacy tools (encrypted vaults, secure cameras, offline scheduling) and an "Expert" mode that unlocks dangerous/powerful root-level tools.
* **Shizuku Core Engine:** Connects directly to the Android OS via Shizuku, allowing the app to bypass standard restrictions to wipe bloatware, shred files, and manage network security without requiring a rooted device.
* **Darknet Mesh Ready:** Includes a localized, encrypted peer-to-peer WebRTC tunnel system. Nodes can connect locally without relying on external DNS or internet infrastructure.
## 🧰 The Arsenal

The dashboard currently features 16 integrated modules:

* **🐝 Swarm Comms & Comm Link:** Encrypted, offline peer-to-peer messaging via local mesh relays.
* **📸 Sovereign Camera:** A stealth capture engine featuring an offline, purely mathematical QR decoder (`jsQR`) that works even when Android OS services are restricted, plus background-ready recording.
* **☢️ Data Shredder (Expert):** Irreversibly wipes sensitive files from the filesystem.
* **☣️ Target Eradication (Expert):** Root-level bloatware and hidden app removal via the Shizuku bridge.
* **🔏 AES Cipher & PGP:** Military-grade text encryption and offline key management.
* **🏦 Secure Vault & Encrypted Docs:** Zero-knowledge local storage for markdown files and sensitive data.
* **🧮 Stealth Calc:** A fully functional decoy calculator interface for masking the app in high-risk environments.
* **🧠 Smart AI:** A localized intelligence node that processes data entirely on-device.
* *Plus:* Chronos Hub, Calendar Grid, Universal Explorer, Audio/Gallery viewers, and more.
## 🚀 Installation

You can download the latest compiled Android APK directly from the **[Releases](../../releases)** tab.

1. Download the `.apk` file to your Android device.
2. Allow installation from unknown sources.
3. *(Optional but Recommended)*: Connect the app to a running Shizuku instance to unlock the Expert tools (Data Shredder, Eradication, etc.).

## 🛣️ Roadmap: The Desktop Node

The current mobile release is just Phase 1. The long-term vision for Sovereign Tools is to create a seamless, encrypted ecosystem between mobile and desktop infrastructure. 

**Upcoming:** A Desktop/Computer Node built on Electron/Tauri that can seamlessly bridge with the Android app over the local Swarm mesh, allowing secure file drops, remote shredding, and synchronized encrypted vaults without a central server.

## 🤝 Contributing

This project is open-source and looking for contributors who value privacy, security, and decentralized tech. Whether it's expanding the Shizuku scripts, optimizing the WASM AI, or helping build the future Desktop Node, pull requests are welcome.

## 📞 Secure Contact

If you have vulnerabilities to report, want to collaborate on the desktop node, or wish to support the creator:
* **Email:** `xNoOnex@dnmx.cc`
* **PGP Key:** The 2048-bit RSA Public Key is available directly inside the app on the **Settings -> Support** tab. 

---
*Stay sovereign.*

