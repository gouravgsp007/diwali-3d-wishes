import { PowderParticlePool } from './powder-particle-pool';
import { RangoliCompletionDetector } from './rangoli-completion-detector';

const GULAL_PALETTE = [
  '#FF7A00', // Saffron
  '#E11D74', // Rani Pink
  '#06B6D4', // Peacock Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Sacred Gold
];

export class RangoliCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D | null;

  private particlePool = new PowderParticlePool();
  private completionDetector = new RangoliCompletionDetector();

  private isDrawing = false;
  private lastPoint: { x: number; y: number } | null = null;
  private currentColorIndex = 0;
  private strokeColor = GULAL_PALETTE[0];
  private strokeCount = 0;

  private width = 0;
  private height = 0;
  private centerX = 0;
  private centerY = 0;
  private mandalaRadius = 140;

  private animationFrameId: number | null = null;
  private lastTime = 0;
  private onProgressCallback?: (progress: number) => void;

  constructor(private readonly container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full block touch-none cursor-crosshair';
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.trailCanvas = document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d', { alpha: true });

    this.container.appendChild(this.canvas);
    this.resize();
    this.attachEvents();
    this.startLoop();
  }

  public setOnProgress(cb: (progress: number) => void): void {
    this.onProgressCallback = cb;
  }

  public resize(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    this.width = Math.floor(rect.width || window.innerWidth || 360);
    this.height = Math.floor(rect.height || window.innerHeight || 640);

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Resize trail canvas while preserving content if already drawn
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.trailCanvas.width;
    tempCanvas.height = this.trailCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx && this.trailCanvas.width > 0) {
      try {
        tempCtx.drawImage(this.trailCanvas, 0, 0);
      } catch (_) {}
    }

    this.trailCanvas.width = this.canvas.width;
    this.trailCanvas.height = this.canvas.height;
    if (this.trailCtx) {
      this.trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (tempCtx && tempCanvas.width > 0) {
        try {
          this.trailCtx.drawImage(tempCanvas, 0, 0, this.width, this.height);
        } catch (_) {}
      }
    }

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // Radius adapts responsively: smaller on mobile, grand on laptop
    this.mandalaRadius = Math.min(this.width, this.height) * 0.32;
    this.completionDetector.updateCenterAndRadius(this.centerX, this.centerY, this.mandalaRadius);
  }

  private onResize = (): void => {
    this.resize();
  };

  private attachEvents(): void {
    window.addEventListener('resize', this.onResize);

    const getPos = (e: PointerEvent): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.isDrawing = true;
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch (_) {}

      const pos = getPos(e);
      this.lastPoint = pos;
      this.strokeColor = GULAL_PALETTE[this.currentColorIndex % GULAL_PALETTE.length];
      this.currentColorIndex++;

      this.drawPowderDot(pos.x, pos.y, this.strokeColor);
      this.particlePool.emit(pos.x, pos.y, this.strokeColor, 6);
      this.completionDetector.registerPoint(pos.x, pos.y);
      this.onProgressCallback?.(this.completionDetector.getProgress());
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing || !this.lastPoint) return;
      e.preventDefault();

      const pos = getPos(e);
      this.drawPowderSegment(this.lastPoint.x, this.lastPoint.y, pos.x, pos.y, this.strokeColor);
      this.particlePool.emit(pos.x, pos.y, this.strokeColor, 3);
      this.lastPoint = pos;

      this.strokeCount++;
      if (this.strokeCount % 12 === 0) {
        // Subtle color shift along long continuous strokes
        this.strokeColor = GULAL_PALETTE[(this.currentColorIndex + Math.floor(this.strokeCount / 12)) % GULAL_PALETTE.length];
      }

      this.completionDetector.registerPoint(pos.x, pos.y);
      this.onProgressCallback?.(this.completionDetector.getProgress());
    });

    const stopDrawing = (e?: PointerEvent): void => {
      if (this.isDrawing && e && 'pointerId' in e) {
        try {
          this.canvas.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      this.isDrawing = false;
      this.lastPoint = null;
      this.completionDetector.breakStroke();
    };

    this.canvas.addEventListener('pointerup', stopDrawing);
    this.canvas.addEventListener('pointercancel', stopDrawing);
  }

  /**
   * Stippled powder grain rendering to replicate authentic dry gulal texture.
   */
  private drawPowderDot(x: number, y: number, color: string): void {
    if (!this.trailCtx) return;
    this.trailCtx.save();
    this.trailCtx.fillStyle = color;

    // Center primary grain
    this.trailCtx.beginPath();
    this.trailCtx.arc(x, y, 4, 0, Math.PI * 2);
    this.trailCtx.fill();

    // Micro-speckles surrounding the touch
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 6;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const size = 1 + Math.random() * 2;
      this.trailCtx.beginPath();
      this.trailCtx.arc(px, py, size, 0, Math.PI * 2);
      this.trailCtx.fill();
    }

    this.trailCtx.restore();
  }

  private drawPowderSegment(x1: number, y1: number, x2: number, y2: number, color: string): void {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.floor(dist / 3));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      this.drawPowderDot(x, y, color);
    }
  }

  private startLoop(): void {
    this.lastTime = performance.now();
    const render = (time: number): void => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw glowing sacred circular 8-petal mandala guide
        this.drawMandalaGuide(this.ctx);

        // 2. Draw persistent user powder trail
        if (this.trailCanvas.width > 0 && this.trailCanvas.height > 0) {
          try {
            this.ctx.drawImage(this.trailCanvas, 0, 0, this.width, this.height);
          } catch (_) {}
        }

        // 3. Draw dynamic flying powder dust particles
        this.particlePool.updateAndDraw(this.ctx, dt);
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  /**
   * Renders a golden sacred 8-petal lotus mandala outline guide.
   */
  private drawMandalaGuide(ctx: CanvasRenderingContext2D): void {
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.mandalaRadius;

    ctx.save();

    // Soft outer golden halo
    const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.2);
    haloGrad.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
    haloGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.03)');
    haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.5;

    // 1. Concentric circles with dashed ornamental patterns
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 8 Sacred Lotus Petals
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      const nextAngle = ((i + 1) * Math.PI * 2) / petals;
      const midAngle = (angle + nextAngle) / 2;

      const x1 = cx + Math.cos(angle) * (r * 0.7);
      const y1 = cy + Math.sin(angle) * (r * 0.7);
      const x2 = cx + Math.cos(nextAngle) * (r * 0.7);
      const y2 = cy + Math.sin(nextAngle) * (r * 0.7);

      const tipX = cx + Math.cos(midAngle) * r;
      const tipY = cy + Math.sin(midAngle) * r;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(tipX, tipY, x2, y2);
      ctx.stroke();
    }

    // 3. Central Diya symbol motif
    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public getProgress(): number {
    return this.completionDetector.getProgress();
  }

  public isComplete(): boolean {
    return this.completionDetector.isComplete();
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.particlePool.clear();
    this.canvas.remove();
    this.trailCanvas.remove();
  }
}
