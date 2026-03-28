<<<<<<< HEAD
# Demo-Projects
=======
# PDF Studio

Local-first PDF editor built with React, `pdf.js`, `pdf-lib`, and `tesseract.js`.

## Features

- Open large PDFs locally in the browser
- Accurate page rendering with `pdf.js`
- Replace existing text by clicking extracted text regions
- Add new text, highlights, comments, shapes, images, and signatures
- Drag, resize, duplicate, delete, undo, and redo overlay edits
- OCR fallback for scanned/image-only pages with `tesseract.js`
- Export edited PDFs with overlays embedded into the final file
- Dark mode, responsive layout, and no server-side upload requirement

## Architecture

- `pdf.js` renders original pages and extracts text positions
- Overlay editor keeps edits in normalized page coordinates for stability across zoom levels
- `pdf-lib` writes edits into the exported PDF while preserving the original page content
- OCR is page-scoped so large documents do not trigger full-document recognition by default
- IntersectionObserver-based lazy rendering prevents rendering every page at once

## Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Notes

- This implementation is local-first. No backend is required for standard use.
- Existing PDF text is edited using replacement overlays drawn at the original text position. This preserves layout visually and exports reliably without trying to rewrite arbitrary PDF content streams.
- OCR is intentionally manual per page because running OCR automatically across a 100MB+ scan would degrade responsiveness.
- Embedded export fonts currently use PDF standard fonts for reliability. If you need exact font substitution for custom fonts, add font upload/embedding in `src/lib/pdfExport.js`.

## Folder Structure

```text
src/
  components/
  hooks/
  lib/
```
>>>>>>> bff329e (Added 3 projects)
