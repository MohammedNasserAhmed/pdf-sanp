
# 📸 PDF Snap Pro: Elite Serialization Engine

<p align="center">
  <img src="public/pwa-512x512.png" width="180" alt="PDF Snap Pro Logo">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-FF6D00?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Web%20|%20Desktop%20|%20Mobile-brightgreen?style=for-the-badge" alt="Platforms">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Build-Passing-vibrant?style=for-the-badge" alt="Build Status">
</p>

---

## ✨ Overview

**PDF Snap Pro** is a high-performance, deterministic document processing engine designed for architects, engineers, and developers who require **pixel-perfect accuracy**. Whether you're running it on a high-end desktop, a mobile device, or via a web browser, it delivers consistent, 300 DPI snapshots with zero margin artifacts.

### 🧠 Project Mind-Map

```mermaid
graph TD
    Root(("PDF Snap Pro"))
    
    Root --> Core["Core Engine"]
    Core --> P1["PDF.js Vector Parser"]
    Core --> P2["300 DPI Rasterization"]
    Core --> P3["Zero-Margin Math"]
    
    Root --> Platforms["Platforms"]
    Platforms --> L1["Web (Modern Browsers)"]
    Platforms --> L2["Desktop (Electron App)"]
    Platforms --> L3["Mobile (PWA Installable)"]
    
    Root --> Features["Features"]
    Features --> F1["Filename Sanitization"]
    Features --> F2["Batch Processing"]
    Features --> F3["Unified ZIP Export"]
    
    Root --> Tech["Tech Stack"]
    Tech --> T1["React 19"]
    Tech --> T2["Tailwind CSS"]
    Tech --> T3["JSZip"]
    Tech --> T4["Vite"]
```

---

## ⚡ Technical Architecture

The following diagram illustrates the high-fidelity serialization pipeline.

```mermaid
graph TD
    A["Upload PDF Files"] --> B{"Sanitization"}
    B -->|"Clean Names"| C["Load PDF.js Parser"]
    C --> D["Calculate MediaBox Bounds"]
    D --> E["Native 300 DPI Render"]
    E --> F["Generate PNG Snapshot"]
    F --> G["Zip Package Creation"]
    G --> H["Unified ZIP Download"]
    
    subgraph "Processing Logic"
    C
    D
    E
    end
```

---

## 🚀 Multi-Platform Launch Guide

### 📂 1. Desktop Application (Electron)
Experience the power of a native desktop shell with system-level optimization.

- **Developer Mode**:
  ```powershell
  npm run electron:dev
  ```
- **Build Portable App**:
  ```powershell
  npm run electron:build
  ```
> [!TIP]
> The desktop version supports larger file batches and provides a dedicated workspace environment.

### 📱 2. Mobile Experience (PWA)
Install PDF Snap Pro directly to your home screen with zero installation.

1. **Build the Assets**: `npm run build`
2. **Preview & Host**: `npm run preview`
3. **Install**: Open the link in Chrome (Android) or Safari (iOS) and select **"Add to Home Screen"**.

> [!IMPORTANT]
> The mobile version utilizes sophisticated service workers for offline processing and instant updates.

### 🌐 3. Web Deployment
Deploy to any static hosting (Vercel, Netlify, GitHub Pages).

```bash
npm run build
```

---

## 🛠 Features & Patches

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Filename Sanitization** | Auto-strips special characters and spaces for OS safety. | ✅ Stable |
| **300 DPI Rendering** | High-fidelity snapshots at exact MediaBox dimensions. | ✅ Stable |
| **Batch ZIP Export** | Multi-file packaging with organized folder structure. | ✅ Stable |
| **Cross-Platform UI** | Responsive dark-mode interface powered by Tailwind. | ✅ Stable |
| **Offline Support** | Fully functional processing without internet connection. | 🛡️ Patch 1.2 |

---

## 💻 Development Workflow

To contribute or extend the engine:

1. **Clone & Install**:
   ```bash
   npm install
   ```
2. **Run Linting**:
   ```bash
   npm run lint
   ```
3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

```mermaid
gantt
    title Development Roadmap
    dateFormat  YYYY-MM-DD
    section Core
    PDF Rendering Logic     :done, des1, 2025-12-01, 2025-12-10
    Sanitization Engine     :done, des2, 2025-12-10, 2025-12-15
    section Multi-Platform
    Electron Integration    :done, des3, 2025-12-20, 2025-12-22
    PWA Implementation      :active, des4, 2025-12-22, 2025-12-24
    section Future
    Advanced OCR Patches    :crit, active, des5, 2026-01-01, 15d
```

---

<p align="center">
  <i>Built with precision by the PDF Snap Pro Team.</i>
</p>
