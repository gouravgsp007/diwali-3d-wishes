/**
 * Foreground Sky Lantern (Akash Kandil) Overlay Component.
 *
 * Renders authentic glowing paper lanterns on a high-performance 2D Canvas positioned
 * at z-index: 25 (directly in front of and above the glassmorphic greeting card modal).
 *
 * Key Behaviors:
 * - Spawns lanterns from below the screen bottom (y >= window.innerHeight + 60px).
 * - Lanterns ascend across the screen, floating OVER the wish message card into the celestial sky.
 * - Uses a pre-rasterized offscreen canvas sprite (0 GC in RAF loop).
 * - Organic sinusoidal horizontal swaying and gentle tilting kinematics.
 * - Zero CPU / Zero Battery Draw: RAF loop completely pauses when all lanterns have floated away.
 * - Full cleanup on dispose() per ASVS V14.
 */

interface LanternParticle {
  x: number;
  y: number;
  baseX: number;
  vy: number;
  swayFreq: number;
  swayPhase: number;
  swayAmp: number;
  scale: number;
  tilt: number;
  tiltSpeed: number;
  alpha: number;
  type: 'orange' | 'red';
}

export class SkyLanternOverlay {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private parentContainer: HTMLElement | null = null;
  private lanterns: LanternParticle[] = [];
  private rafId: number | null = null;
  private lastTime = 0;
  private isDisposed = false;

  // Pre-rasterized 64x128 offscreen sprite caches (Orange and Red lanterns)
  private spriteOrange: HTMLCanvasElement | null = null;
  private spriteRed: HTMLCanvasElement | null = null;

  constructor() {
    this.initSprites();
  }

  /**
   * Pre-renders offscreen canvas sprites for authentic Akash Kandil lanterns.
   * Rendered once at boot (CPU < 3ms, GPU texture ~32 KB).
   */
  private initSprites(): void {
    if (typeof document === 'undefined') return;

    this.spriteOrange = this.createLanternSprite('#ff7722', '#ffaa22', '#ffd700');
    this.spriteRed = this.createLanternSprite('#ee2244', '#ff4433', '#ffd700');
  }

  private createLanternSprite(bodyColor: string, glowColor: string, ringColor: string): HTMLCanvasElement {
    const w = 64;
    const h = 120;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const cx = w / 2;
    const cy = 45;

    // 1. Ambient outer luminous flame halo
    const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 38);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(0.35, 'rgba(255, 170, 34, 0.45)');
    glow.addColorStop(0.7, 'rgba(255, 100, 20, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tapered paper lantern polygon (Akash Kandil)
    // Slightly narrower at top (r=14), wider at bottom (r=20), height=38
    const topY = cy - 18;
    const botY = cy + 20;
    const topR = 14;
    const botR = 19;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - topR, topY);
    ctx.lineTo(cx + topR, topY);
    ctx.lineTo(cx + botR, botY);
    ctx.lineTo(cx - botR, botY);
    ctx.closePath();

    // Paper translucency gradient
    const paperGrad = ctx.createLinearGradient(cx, topY, cx, botY);
    paperGrad.addColorStop(0, '#ffffff');
    paperGrad.addColorStop(0.2, bodyColor);
    paperGrad.addColorStop(0.85, bodyColor);
    paperGrad.addColorStop(1, 'rgba(120, 20, 5, 0.95)');
    ctx.fillStyle = paperGrad;
    ctx.fill();

    // Subtle paper ribs (vertical pleat lines)
    ctx.strokeStyle = 'rgba(255, 220, 160, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 7, topY);
    ctx.lineTo(cx - 9, botY);
    ctx.moveTo(cx + 7, topY);
    ctx.lineTo(cx + 9, botY);
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, botY);
    ctx.stroke();

    // 3. Bamboo framing rings (Top & Bottom)
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, topY, topR, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, botY, botR, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Inner intense flame core
    const flameCore = ctx.createRadialGradient(cx, cy + 8, 0, cx, cy + 8, 12);
    flameCore.addColorStop(0, '#ffffff');
    flameCore.addColorStop(0.5, '#fff3b0');
    flameCore.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = flameCore;
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hanging golden tassels (Akash Kandil frills)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    const tasselOffsets = [-12, -4, 4, 12];
    for (const off of tasselOffsets) {
      ctx.beginPath();
      ctx.moveTo(cx + off, botY);
      ctx.quadraticCurveTo(cx + off + 2, botY + 16, cx + off, botY + 28);
      ctx.stroke();
    }
    ctx.restore();

    return canvas;
  }

  /**
   * Mounts the full-screen lantern overlay into the DOM container at z-index: 25.
   */
  public mount(container: HTMLElement): void {
    if (this.canvas || typeof document === 'undefined') return;
    this.parentContainer = container;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'sky-lantern-foreground-canvas';
    this.canvas.className =
      'fixed inset-0 pointer-events-none z-25 select-none w-full h-full';
    this.canvas.style.zIndex = '25'; // Firmly above #greeting-modal-overlay (z-index: 10)
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';

    this.parentContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.resize();
  };

  private resize(): void {
    if (!this.canvas) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.75);
    const w = typeof window !== 'undefined' ? window.innerWidth : 800;
    const h = typeof window !== 'undefined' ? window.innerHeight : 600;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /**
   * Spawns a flock of glowing lanterns ascending from below the screen bottom.
   *
   * @param count Number of lanterns to release (default: 5)
   */
  public spawnLanterns(count = 5): void {
    if (this.isDisposed || typeof window === 'undefined') return;

    const screenWidth = window.innerWidth || 800;
    const screenHeight = window.innerHeight || 600;

    for (let i = 0; i < count; i++) {
      // Stagger spawn x-positions across 10% to 90% screen width
      const margin = screenWidth * 0.12;
      const spreadWidth = screenWidth - margin * 2;
      const x = margin + Math.random() * spreadWidth;

      // Spawn starting BELOW the bottom of the screen
      const y = screenHeight + 50 + i * 28 + Math.random() * 45;

      const lantern: LanternParticle = {
        x,
        baseX: x,
        y,
        vy: -95 - Math.random() * 55, // Upward velocity (95..150 px/s)
        swayFreq: 1.2 + Math.random() * 0.9,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: 16 + Math.random() * 18,
        scale: 0.62 + Math.random() * 0.28,
        tilt: 0,
        tiltSpeed: 1.5 + Math.random() * 0.8,
        alpha: 0.95,
        type: Math.random() > 0.4 ? 'orange' : 'red',
      };

      this.lanterns.push(lantern);
    }

    // Start RAF loop if not already running
    if (this.rafId === null) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  private loop = (timestamp: number): void => {
    if (this.isDisposed) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    if (this.lanterns.length > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      // Auto-pause RAF when all lanterns have exited the screen (0% CPU draw)
      this.rafId = null;
      if (this.ctx) {
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
        this.ctx.clearRect(0, 0, screenWidth, screenHeight);
      }
    }
  };

  /**
   * Advances lantern kinematic simulation.
   */
  public update(dt: number): void {
    if (dt <= 0) return;

    for (let i = this.lanterns.length - 1; i >= 0; i--) {
      const l = this.lanterns[i];
      l.y += l.vy * dt;
      l.swayPhase += l.swayFreq * dt;

      // Smooth horizontal sine-wave sway around baseX
      l.x = l.baseX + Math.sin(l.swayPhase) * l.swayAmp;

      // Subtle atmospheric tilting along sway velocity
      l.tilt = Math.cos(l.swayPhase) * 0.08;

      // Soft fading when entering stratosphere (top 15% of screen)
      if (l.y < 120) {
        l.alpha = Math.max(0, l.y / 120);
      }

      // Remove once safely above the viewport
      if (l.y < -150 || l.alpha <= 0.02) {
        this.lanterns.splice(i, 1);
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

    this.ctx.clearRect(0, 0, screenWidth, screenHeight);

    for (const l of this.lanterns) {
      const sprite = l.type === 'orange' ? this.spriteOrange : this.spriteRed;
      if (!sprite) continue;

      this.ctx.save();
      this.ctx.globalAlpha = l.alpha;
      this.ctx.translate(l.x, l.y);
      this.ctx.rotate(l.tilt);
      this.ctx.scale(l.scale, l.scale);

      // Center sprite at (0, 0)
      this.ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      this.ctx.restore();
    }
  }

  public getActiveCount(): number {
    return this.lanterns.length;
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
    this.lanterns.length = 0;
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
