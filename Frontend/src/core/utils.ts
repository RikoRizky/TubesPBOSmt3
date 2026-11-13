/** Batasi nilai di antara min dan max. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Interpolasi linear dari a ke b sebesar t (0..1). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Tunggu sekian milidetik (dipakai untuk simulasi waktu tunggu jaringan). */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
