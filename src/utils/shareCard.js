// Turns an on-page SVG card into a PNG and shares it. On phones (Web Share with files) WhatsApp opens
// with the card image attached and the message as its caption. Where that is not supported (most
// desktops) the card is saved and WhatsApp opens with the message, so the image can be attached.

const toDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

/** PNG blob of an <svg> element at the given size (external images are embedded first). */
export async function svgToPngBlob(svg, width, height) {
  const clone = svg.cloneNode(true);
  for (const img of clone.querySelectorAll('image')) {
    const href = img.getAttribute('href');
    if (href && !href.startsWith('data:')) img.setAttribute('href', await toDataUrl(await (await fetch(href)).blob()));
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  const image = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  return new Promise(res => canvas.toBlob(res, 'image/png'));
}

export function savePng(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Shares the card. Returns 'shared' (the share sheet opened with the image), 'cancelled', or
 * 'fallback' (image saved + WhatsApp opened with the text).
 */
export async function shareCard({ svg, width, height, fileName, text }) {
  const blob = await svgToPngBlob(svg, width, height);
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return 'shared'; } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  savePng(blob, fileName);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return 'fallback';
}
