import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib';

const FONT_NAME_MAP = {
  Helvetica: StandardFonts.Helvetica,
  HelveticaBold: StandardFonts.HelveticaBold,
  TimesRoman: StandardFonts.TimesRoman,
  TimesRomanBold: StandardFonts.TimesRomanBold,
  Courier: StandardFonts.Courier,
};

function hexToRgb(hex) {
  const cleaned = hex.replace('#', '');
  const normalized = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned;
  const value = Number.parseInt(normalized, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
}

function toPdfY(pageHeight, y, height) {
  return pageHeight - y - height;
}

export async function exportEditedPdf({ sourceBytes, pageDimensions, elementsByPage }) {
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const fontCache = new Map();

  async function getFont(fontFamily) {
    const fontName = FONT_NAME_MAP[fontFamily] || StandardFonts.Helvetica;
    if (!fontCache.has(fontName)) {
      fontCache.set(fontName, await pdfDoc.embedFont(fontName));
    }
    return fontCache.get(fontName);
  }

  for (const [pageIndexText, items] of Object.entries(elementsByPage)) {
    const pageIndex = Number(pageIndexText);
    const page = pdfDoc.getPage(pageIndex);
    const pageSize = pageDimensions[pageIndex];
    if (!page || !pageSize) {
      continue;
    }

    for (const item of items) {
      const x = item.x * pageSize.width;
      const y = item.y * pageSize.height;
      const width = item.width * pageSize.width;
      const height = item.height * pageSize.height;
      const pdfY = toPdfY(pageSize.height, y, height);

      if (item.type === 'text') {
        const font = await getFont(item.style.fontFamily);
        const fontSize = Math.max(6, item.style.fontSize * pageSize.scaleBase);
        if (item.eraseRect) {
          page.drawRectangle({
            x,
            y: pdfY,
            width,
            height,
            color: rgb(1, 1, 1),
          });
        }
        if (item.text?.trim()) {
          const { r, g, b } = hexToRgb(item.style.color);
          const textWidth = font.widthOfTextAtSize(item.text, fontSize);
          let drawX = x;
          if (item.style.align === 'center') {
            drawX = x + Math.max(0, (width - textWidth) / 2);
          }
          if (item.style.align === 'right') {
            drawX = x + Math.max(0, width - textWidth);
          }
          page.drawText(item.text, {
            x: drawX,
            y: pdfY + Math.max(0, height - fontSize),
            size: fontSize,
            font,
            color: rgb(r, g, b),
            maxWidth: width,
          });
        }
      }

      if (item.type === 'highlight') {
        page.drawRectangle({
          x,
          y: pdfY,
          width,
          height,
          color: rgb(1, 0.96, 0.3),
          opacity: 0.45,
          borderOpacity: 0,
        });
      }

      if (item.type === 'shape') {
        const { r, g, b } = hexToRgb(item.style.color);
        page.drawRectangle({
          x,
          y: pdfY,
          width,
          height,
          borderColor: rgb(r, g, b),
          borderWidth: item.style.strokeWidth || 2,
          color: item.style.fill ? rgb(r, g, b) : undefined,
          opacity: item.style.fill ? 0.15 : 1,
        });
      }

      if (item.type === 'comment') {
        page.drawRectangle({
          x,
          y: pdfY,
          width,
          height,
          color: rgb(1, 0.97, 0.67),
          borderColor: rgb(0.85, 0.7, 0.1),
          borderWidth: 1,
        });
        const font = await getFont('Helvetica');
        page.drawText(item.text || 'Comment', {
          x: x + 8,
          y: pdfY + Math.max(0, height - 18),
          size: 12,
          font,
          color: rgb(0.35, 0.27, 0.04),
          maxWidth: Math.max(20, width - 16),
        });
      }

      if (item.type === 'image' || item.type === 'signature') {
        const imageBytes = await fetch(item.src).then((res) => res.arrayBuffer());
        const embedded = item.src.startsWith('data:image/png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        page.drawImage(embedded, { x, y: pdfY, width, height });
      }
    }
  }

  return pdfDoc.save();
}
