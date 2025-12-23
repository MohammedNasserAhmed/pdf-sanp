
# 📸 PDF Snap Pro: High-Fidelity Serialization Engine

**The ultimate deterministic batch processor for pixel-perfect PDF document extraction.**

PDF Snap Pro is an advanced utility engineered for production-grade document workflows. It enforces a strict "Zero Margin" policy, rendering PDF first-pages at a native 300 DPI resolution and automatically sanitizing filenames to ensure system compatibility.

## 🎯 Technical Pillars

### 1. Automatic Filename Sanitization
Document integrity is maintained by ensuring "regular" filenames. Upon upload:
- Spaces and special characters are replaced with underscores (`_`).
- Non-alphanumeric characters are stripped.
- Filenames are collapsed for consistency (e.g., `My Document @ 2024.pdf` → `My_Document_2024.pdf`).
- All outputs (Renamed PDF and PNG Screenshot) share this sanitized base name.

### 2. High-Precision Rendering
- **Native 300 DPI**: Rasterization calculated at a scale factor of 4.1667x.
- **Zero-Margin Math**: Canvas dimensions are bound strictly to the PDF `MediaBox`.
- **Lossless Serialization**: Exports to optimized `image/png`.

### 3. Unified Batch Export
The pipeline culminates in a single, high-reliability download:
- **Individual Downloads**: Triggered during live processing for immediate feedback.
- **ZIP Package**: A unified export containing two organized folders:
  - `/pdfs`: The sanitized/renamed source documents.
  - `/screenshots`: The pixel-perfect 300 DPI PNG snapshots.

## 📂 Installation & Execution

1. **Serve locally**: Use any static file server.
   ```bash
   npx serve .
   ```
2. **Load PDFs**: Select multiple files. They are sanitized on the fly.
3. **Execute**: Click "PROCESS & DOWNLOAD". The engine will sequentially render images and automatically trigger a ZIP download of the complete set once finished.

## 🏗 Stack
- **React 19**: Responsive state management.
- **PDF.js**: Vector parsing engine.
- **JSZip**: In-memory batch packaging.
- **Tailwind CSS**: Professional engineering UI.

---
*Built for architects who demand deterministic results.*
