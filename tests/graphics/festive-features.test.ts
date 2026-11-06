import { describe, it, expect } from 'vitest';
import { Starfield } from '../../src/graphics/fx/starfield';
import { SkyLanternsManager } from '../../src/graphics/fx/sky-lanterns-manager';
import { FlowerShower } from '../../src/graphics/fx/flower-shower';
import { InteractiveSparkler } from '../../src/graphics/fx/interactive-sparkler';

describe('Festive 3D Features (Stars, Lanterns, Flowers, Sparkler)', () => {
  it('Starfield creates twinkling points and shooting star streak, updating without error', () => {
    const starfield = new Starfield(100);
    expect(starfield.group.children.length).toBe(2);

    expect(() => starfield.update(0.016, 1.0)).not.toThrow();
    // Simulate elapsed time triggering shooting star
    expect(() => starfield.update(0.016, 5.0)).not.toThrow();

    starfield.dispose();
  });

  it('SkyLanternsManager releases lanterns with glowing lights and updates altitude', () => {
    const manager = new SkyLanternsManager();
    expect(manager.getLanternsCount()).toBe(0);

    manager.releaseLantern();
    expect(manager.getLanternsCount()).toBe(1);

    const initialY = manager.group.children[0].position.y;
    manager.update(0.5, 1.0);
    const newY = manager.group.children[0].position.y;
    expect(newY).toBeGreaterThan(initialY);

    manager.releaseLantern();
    expect(manager.getLanternsCount()).toBe(2);

    // Release cluster of 5 mini lanterns
    manager.releaseCluster(5);
    expect(manager.getLanternsCount()).toBe(7);

    manager.dispose();
    expect(manager.getLanternsCount()).toBe(0);
  });

  it('FlowerShower cascades flower petals and settles them upon the thali level', () => {
    const shower = new FlowerShower();
    expect(shower.getPetalsCount()).toBe(0);

    shower.triggerFlowerShower(20);
    expect(shower.getPetalsCount()).toBe(20);

    // Initial petal above 2.0
    const firstPetal = shower.group.children[0];
    expect(firstPetal.position.y).toBeGreaterThan(2.0);
    const initialY = firstPetal.position.y;

    // Update with delta time
    shower.update(0.5, 0.5);
    expect(firstPetal.position.y).toBeLessThan(initialY);

    // Fast-forward to floor level
    for (let i = 0; i < 20; i++) {
      shower.update(0.5, i);
    }
    expect(firstPetal.position.y).toBeLessThanOrEqual(0.1);

    shower.dispose();
    expect(shower.getPetalsCount()).toBe(0);
  });

  it('InteractiveSparkler toggles active state, spawns sparks, and emits light', () => {
    let touched = false;
    const sparkler = new InteractiveSparkler((_pos) => {
      touched = true;
    });
    expect(touched).toBe(false);

    expect(sparkler.getActive()).toBe(false);
    sparkler.setActive(true);
    expect(sparkler.getActive()).toBe(true);

    // Update generates particles
    sparkler.update(0.016, 1.0);

    sparkler.setActive(false);
    expect(sparkler.getActive()).toBe(false);

    sparkler.dispose();
  });
});
