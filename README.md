# Eaglercraft Bundle Tool

A utility that packages an entire Eaglercraft game instance — including the game client, settings, plugins, resource packs, and worlds — into a single, self-contained HTML file. This allows developers and creators to easily distribute and share their custom Minecraft‑style experiences built on Eaglercraft.

## How It Works

The tool reads all persistent game data stored in the browser’s **IndexedDB** (where Eaglercraft saves its worlds, configurations, add‑ons, and assets) and embeds that data directly into a standalone HTML file. When a user opens that HTML file, the embedded data is restored into IndexedDB, and the game loads exactly as it was originally saved.

No external servers, no extra files — just one HTML file that runs anywhere Eaglercraft can run (modern browsers, no plugins required).

## Features

- 📦 **All‑in‑one packaging** – Bundle the game core, your custom settings, plugins, texture packs, and multiple worlds.
- 🔁 **Portable** – Share your creation as a single file that others can download and play offline.
- 🧩 **Developer‑friendly** – Ideal for showcasing maps, modpacks, or pre‑configured game modes.
- ⚡ **Preserves state** – Retains player inventory, achievements, and world progress.

## Usage

1. Run your customized Eaglercraft instance in a browser.
2. Use this tool to export the current IndexedDB data into an HTML file.
3. Distribute the generated HTML file.
4. End users open the file → the game restores all data automatically → play.

> *Note: Detailed CLI or UI instructions depend on your implementation. Update this section with actual commands or steps.*

## Important Legal & Ethical Notice

- This repository **does not include any source code or binaries of Eaglercraft**.
- It only provides a tool to package IndexedDB data that you have lawfully created or obtained.
- No game assets, copyrighted Minecraft code, or Eaglercraft distributions are stored or transmitted through this repository.
- Users are solely responsible for complying with all applicable laws and the licensing terms of the game assets they bundle.
- This tool does not facilitate or encourage piracy or unlawful distribution of any kind.

## Disclaimer

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND. The authors are not affiliated with Mojang Studios, Microsoft, or the Eaglercraft project. Use at your own risk.

---

For questions or contributions, please open an issue or pull request.