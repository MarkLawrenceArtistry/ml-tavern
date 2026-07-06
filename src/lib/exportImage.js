import { toPng } from 'html-to-image';

/**
 * Converts an already-loaded <img> to a data-URL via canvas.
 * Works because the image was loaded with crossOrigin="anonymous".
 */
function imgToDataUrl(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

/**
 * Exports a DOM node to PNG.
 * - Converts all <img> to data-URLs via canvas (no fetch, no CORS issues)
 * - Preserves AND restores the crossorigin attribute (fixes "only works once")
 * - Skips font embedding (fixes Google Fonts SecurityError)
 */
export async function exportNodeToPng(node, options = {}) {
  const imgs = node.querySelectorAll('img');
  const originals = new Map();

  for (const img of Array.from(imgs)) {
    if (!img.src || img.src.startsWith('data:')) continue;
    // Save BOTH src and crossorigin so we can fully restore
    originals.set(img, { src: img.src, crossOrigin: img.getAttribute('crossorigin') });
    try {
      img.src = imgToDataUrl(img);
    } catch {
      // Canvas tainted — leave original src, export may show fallback text
    }
  }

  try {
    return await toPng(node, {
      cacheBust: false,
      pixelRatio: 2,
      fontEmbedCSS: '',
      ...options,
    });
  } finally {
    // Fully restore every image
    originals.forEach((orig, img) => {
      img.src = orig.src;
      if (orig.crossOrigin !== null) {
        img.setAttribute('crossorigin', orig.crossOrigin);
      } else {
        img.removeAttribute('crossorigin');
      }
    });
  }
}