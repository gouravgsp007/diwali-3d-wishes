export interface PowderParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

/**
 * High-performance, zero-allocation object pool for flying Rangoli powder dust.
 * Caps maximum particle count to 150 to guarantee smooth 60fps on mobile chipsets.
 */
export class PowderParticlePool {
  private particles: PowderParticle[] = [];
  private poolSize = 150;

  constructor() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#FF7A00',
        alpha: 1.0,
        life: 0,
        maxLife: 1.0,
      });
    }
  }

  /**
   * Spawns dust particles at the finger touch position with radial velocity and turbulence.
   */
  public emit(x: number, y: number, color: string, count = 4): void {
    let spawned = 0;
    for (let i = 0; i < this.poolSize && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 8;
        p.y = y + (Math.random() - 0.5) * 8;

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 45;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.size = 1.8 + Math.random() * 2.6;
        p.color = color;
        p.alpha = 0.95;
        p.life = 0;
        p.maxLife = 0.4 + Math.random() * 0.4; // 400ms - 800ms
        spawned++;
      }
    }
  }

  /**
   * Updates particle simulation and renders with additive glow.
   */
  public updateAndDraw(ctx: CanvasRenderingContext2D, dt: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      // Physics: drag damping + slight upward convective draft
      p.x += p.vx * dt;
      p.y += p.vy * dt - 12 * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;

      const progress = p.life / p.maxLife;
      const currentAlpha = p.alpha * (1 - progress);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, currentAlpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public clear(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i].active = false;
    }
  }

  public getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.poolSize; i++) {
      if (this.particles[i].active) count++;
    }
    return count;
  }
}
