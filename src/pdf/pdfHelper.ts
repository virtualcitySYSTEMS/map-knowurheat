import { ComponentInternalInstance } from 'vue';
import { jsPDF } from 'jspdf';

async function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = (): void => resolve(img);
  });
}

export function normalizeHexCode(hex: string): string {
  // Erstelle eine lokale Variable und entferne das optionale '#' am Anfang
  const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (sanitizedHex.length === 3) {
    // Dreistelliger Hex-Code -> Sechsstellig erweitern
    return `#${sanitizedHex[0]}${sanitizedHex[0]}${sanitizedHex[1]}${sanitizedHex[1]}${sanitizedHex[2]}${sanitizedHex[2]}`;
  } else if (sanitizedHex.length === 6) {
    // Bereits sechsstellig, einfach mit '#' zurückgeben
    return `#${sanitizedHex}`;
  } else {
    return '#000000';
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export async function recolorTransparentImageAsync(
  base64: string,
  color: string,
): Promise<string> {
  const img = await loadImage(base64);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Problems to create canvas für pdf export image');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  const targetColor = hexToRgb(normalizeHexCode(color)) ?? {
    r: 255,
    g: 255,
    b: 255,
  };

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

    if (r === 255 && g === 255 && b === 255 && a > 0) {
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

export function transText(
  vm: ComponentInternalInstance | null,
  i18n: string,
  variables?: Record<string, unknown>,
): string {
  if (variables) {
    return vm?.proxy?.$st(i18n, variables) ?? '';
  }
  return vm?.proxy?.$st(i18n) ?? '';
}

export const formatterZeroDigits = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatterTwoDigits = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function dynamicTextSize(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  doc: jsPDF,
): void {
  doc.setFontSize(12);
  const actualWidth = doc.getTextWidth(text);
  const actualHeight = 12;

  const widthScale = maxWidth / actualWidth;
  const heightScale = maxHeight / actualHeight;

  const scaleFactor = Math.min(widthScale, heightScale);

  const newFontSize = 12 * scaleFactor;
  doc.setFontSize(newFontSize);
  doc.text(text, x, y);
}
