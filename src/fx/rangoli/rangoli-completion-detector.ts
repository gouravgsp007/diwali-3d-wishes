/**
 * Objective, forgiving radial coverage and stroke tracker for Rangoli mandala completion.
 * Divides the circular pattern into 16 angular sectors ($22.5^\circ$ each).
 */
export class RangoliCompletionDetector {
  private sectors: boolean[] = new Array(16).fill(false);
  private totalStrokeDistance = 0;
  private lastX: number | null = null;
  private lastY: number | null = null;

  constructor(
    private centerX = 0,
    private centerY = 0,
    private radius = 100
  ) {}

  public updateCenterAndRadius(cx: number, cy: number, r: number): void {
    this.centerX = cx;
    this.centerY = cy;
    this.radius = r;
  }

  public registerPoint(x: number, y: number): void {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distFromCenter = Math.hypot(dx, dy);

    // Check if point lands within the active mandala band (between 20% and 125% radius)
    if (distFromCenter >= this.radius * 0.2 && distFromCenter <= this.radius * 1.25) {
      let angle = Math.atan2(dy, dx); // [-PI, PI]
      if (angle < 0) angle += Math.PI * 2; // [0, 2*PI]

      const sectorIdx = Math.floor((angle / (Math.PI * 2)) * 16) % 16;
      this.sectors[sectorIdx] = true;
    }

    if (this.lastX !== null && this.lastY !== null) {
      const stepDist = Math.hypot(x - this.lastX, y - this.lastY);
      if (stepDist < 100) { // Reject spurious coordinate jumps
        this.totalStrokeDistance += stepDist;
      }
    }

    this.lastX = x;
    this.lastY = y;
  }

  public breakStroke(): void {
    this.lastX = null;
    this.lastY = null;
  }

  public getProgress(): number {
    const sectorsVisited = this.sectors.filter(Boolean).length;
    const sectorProgress = Math.min(1.0, sectorsVisited / 11); // 11 of 16 sectors (~68%)

    const targetDistance = Math.PI * 2 * this.radius * 1.5;
    const distanceProgress = Math.min(1.0, this.totalStrokeDistance / targetDistance);

    // 70% sector coverage weight, 30% stroke density weight
    const combined = sectorProgress * 0.7 + distanceProgress * 0.3;
    return Math.min(1.0, combined);
  }

  public isComplete(): boolean {
    return this.getProgress() >= 0.70;
  }

  public reset(): void {
    this.sectors.fill(false);
    this.totalStrokeDistance = 0;
    this.lastX = null;
    this.lastY = null;
  }
}
