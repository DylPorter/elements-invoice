/** Form helpers: the editor edits major units (300.00), the model stores minor (30000). */

export function minorToMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function majorToMinor(major: string): number {
  const n = parseFloat(major);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
