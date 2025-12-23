
# 📸 PDF Snap: High-Fidelity Document Serialization

**An elite, deterministic batch processor for pixel-perfect PDF-to-Image extraction.**

PDF Snap is a specialized utility engineered for workflows requiring absolute visual fidelity. It treats PDF documents as raw vector data, rendering the initial page at a precise 300 DPI resolution using native browser primitives.

## 🎯 Technical Pillars

### 1. Zero-Margin Logic
Unlike standard "Print-to-Image" or screenshot tools, PDF Snap calculates the exact bounding box of the PDF's first page (`MediaBox` / `CropBox`) and initializes a canvas with those exact dimensions multiplied by the scale factor. This results in an image with:
- **Zero Padding**
- **No UI Artifacts**
- **Lossless PNG Encoding**

### 2. Resolution & Fidelity
- **Native 300 DPI**: Renders at 4.16x the standard PDF unit scale.
- **Print Intent**: Configured with `intent: 'print'` to ensure correct color profile mapping during the rasterization phase.
- **Client-Side Compute**: 100% of the processing happens in the browser's main/worker thread. No data ingress/egress to external servers.

## 🛠 Prerequisites & Setup

### Environment Requirements
- **Browser**: Modern Chromium-based (Chrome, Edge 110+), Firefox, or Safari 16.4+.
- **Host**: Must be served over `http://` or `https://` (local server recommended) for ES Module support and Web Worker isolation.

### Installation & Execution
1. **Clone/Download** the repository.
2. **Launch a local server** in the root directory:
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js (npx)
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser.

## ⚙️ Operating Procedures

### Loading Data
- Use the "Load PDFs" input to select multiple files. 
- The system supports batch selection (Ctrl/Cmd + Click) and directory uploads depending on OS support.

### Processing
- **Batch Processing**: The "Process All" button iterates through the queue sequentially to minimize memory pressure.
- **Single Actions**: Individual files can be processed or re-downloaded directly from the status table.

### Security Permissions
- **Multiple Downloads**: Modern browsers will block batch downloads. Look for the "Multiple Downloads" icon in the address bar and select **"Always Allow"**.
- **Iframe Restrictions**: If running in a restricted sandbox, ensure the `allow-downloads` permission is enabled.

## 🏗 System Architecture
- **React 19**: Leveraging concurrent rendering for smooth UI transitions during heavy compute.
- **PDF.js (Mozilla)**: Core rendering engine for PostScript/PDF parsing.
- **Tailwind CSS**: Utility-first design system for a minimal, functional interface.

---
*Developed for high-stakes engineering environments where precision is non-negotiable.*
