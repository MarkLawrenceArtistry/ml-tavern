import { toPng } from 'html-to-image';

export async function safeToPng(el, options = {}) {
  // Temporarily disable cross-origin stylesheets so html-to-image
  // doesn't throw SecurityError reading their cssRules
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const crossOrigin = links.filter(l => {
    try { void l.sheet?.cssRules; return false; } catch { return true; }
  });
  crossOrigin.forEach(l => (l.disabled = true));

  try {
    return await toPng(el, { cacheBust: true, pixelRatio: 2, ...options });
  } finally {
    crossOrigin.forEach(l => (l.disabled = false));
  }
}