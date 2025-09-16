import { Category } from '@/types/category';

/**
 * Generate visually distinct colors using HSL color space
 * This ensures maximum visual separation between colors
 */
export class DistinctColorGenerator {
  private static readonly GOLDEN_RATIO = 0.618033988749;
  private static hue = Math.random(); // Start with random hue

  /**
   * Convert HSL to hex color
   */
  private static hslToHex(h: number, s: number, l: number): string {
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
    const m = lDecimal - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= hDecimal * 6 && hDecimal * 6 < 1) {
      r = c; g = x; b = 0;
    } else if (1 <= hDecimal * 6 && hDecimal * 6 < 2) {
      r = x; g = c; b = 0;
    } else if (2 <= hDecimal * 6 && hDecimal * 6 < 3) {
      r = 0; g = c; b = x;
    } else if (3 <= hDecimal * 6 && hDecimal * 6 < 4) {
      r = 0; g = x; b = c;
    } else if (4 <= hDecimal * 6 && hDecimal * 6 < 5) {
      r = x; g = 0; b = c;
    } else if (5 <= hDecimal * 6 && hDecimal * 6 < 6) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calculate color distance in LAB color space for better perceptual difference
   */
  private static hexToLab(hex: string): [number, number, number] {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Convert RGB to XYZ
    const toXyz = (c: number) => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
    const xyzR = toXyz(r) * 0.4124564 + toXyz(g) * 0.3575761 + toXyz(b) * 0.1804375;
    const xyzG = toXyz(r) * 0.2126729 + toXyz(g) * 0.7151522 + toXyz(b) * 0.0721750;
    const xyzB = toXyz(r) * 0.0193339 + toXyz(g) * 0.1191920 + toXyz(b) * 0.9503041;

    // Convert XYZ to LAB
    const xn = 95.047, yn = 100.000, zn = 108.883;
    const fx = xyzR / xn > 0.008856 ? Math.pow(xyzR / xn, 1/3) : (7.787 * xyzR / xn + 16/116);
    const fy = xyzG / yn > 0.008856 ? Math.pow(xyzG / yn, 1/3) : (7.787 * xyzG / yn + 16/116);
    const fz = xyzB / zn > 0.008856 ? Math.pow(xyzB / zn, 1/3) : (7.787 * xyzB / zn + 16/116);

    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const bLab = 200 * (fy - fz);

    return [L, a, bLab];
  }

  /**
   * Calculate perceptual color distance
   */
  private static colorDistance(color1: string, color2: string): number {
    const [L1, a1, b1] = this.hexToLab(color1);
    const [L2, a2, b2] = this.hexToLab(color2);
    
    return Math.sqrt(Math.pow(L2 - L1, 2) + Math.pow(a2 - a1, 2) + Math.pow(b2 - b1, 2));
  }

  /**
   * Generate next distinct color using golden ratio
   */
  public static generateNextColor(): string {
    this.hue += this.GOLDEN_RATIO;
    this.hue %= 1;
    
    // Use high saturation and medium lightness for good visibility
    const hue = Math.floor(this.hue * 360);
    const saturation = 70 + Math.random() * 20; // 70-90%
    const lightness = 45 + Math.random() * 20;  // 45-65%
    
    return this.hslToHex(hue, saturation, lightness);
  }

  /**
   * Generate a color that's maximally different from existing colors
   */
  public static generateDistinctColor(existingColors: string[]): string {
    if (existingColors.length === 0) {
      return this.generateNextColor();
    }

    let bestColor = '';
    let maxMinDistance = 0;

    // Try 20 candidates and pick the one with maximum minimum distance
    for (let i = 0; i < 20; i++) {
      const candidate = this.generateNextColor();
      
      // Find minimum distance to existing colors
      const minDistance = Math.min(
        ...existingColors.map(existing => this.colorDistance(candidate, existing))
      );

      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestColor = candidate;
      }
    }

    return bestColor || this.generateNextColor();
  }

  /**
   * Get next color for category creation, considering existing categories
   */
  public static getNextCategoryColor(existingCategories: Category[]): string {
    const existingColors = existingCategories.map(cat => cat.color);
    return this.generateDistinctColor(existingColors);
  }

  /**
   * Generate multiple distinct colors for batch operations
   */
  public static generateMultipleDistinctColors(count: number, existingColors: string[] = []): string[] {
    const colors: string[] = [...existingColors];
    const newColors: string[] = [];

    for (let i = 0; i < count; i++) {
      const nextColor = this.generateDistinctColor(colors);
      colors.push(nextColor);
      newColors.push(nextColor);
    }

    return newColors;
  }
}