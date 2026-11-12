/** Returns a safe hex colour and a readable text colour to sit on top of it. */
export function accentVars(input: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(input) ? input : '#c9f24d';
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { accent: hex, onAccent: lum > 0.36 ? '#0d0e0c' : '#ffffff' };
}
