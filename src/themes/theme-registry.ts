import type { ExperienceTheme, OccasionId } from './experience-theme.interface';
import { DiwaliTheme } from './diwali/diwali-theme';
import { BirthdayTheme } from './birthday/birthday-theme';
import { WeddingTheme } from './wedding/wedding-theme';
import { NewYearTheme } from './newyear/newyear-theme';

/**
 * Central registry and dynamic resolver for all celebration experience themes.
 */
export class ThemeRegistry {
  private static instance: ThemeRegistry;
  private themes: Map<OccasionId, ExperienceTheme> = new Map();
  private defaultThemeId: OccasionId = 'diwali';

  constructor() {
    // Register standard themes
    this.register(new DiwaliTheme());
    this.register(new BirthdayTheme());
    this.register(new WeddingTheme());
    this.register(new NewYearTheme());
  }

  public static getInstance(): ThemeRegistry {
    if (!ThemeRegistry.instance) {
      ThemeRegistry.instance = new ThemeRegistry();
    }
    return ThemeRegistry.instance;
  }

  /**
   * Registers an occasion theme implementation.
   */
  public register(theme: ExperienceTheme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Retrieves a theme by its occasion ID.
   */
  public get(id: OccasionId | string): ExperienceTheme | undefined {
    return this.themes.get(id as OccasionId);
  }

  /**
   * Returns all registered themes.
   */
  public getAll(): ExperienceTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Resolves the appropriate theme based on:
   * 1. Decrypted payload `templateId`
   * 2. URL search param `?theme=`
   * 3. Fallback to default theme ('diwali') for backwards compatibility.
   */
  public resolve(templateId?: string | null, queryTheme?: string | null): ExperienceTheme {
    const raw = (templateId || queryTheme || '').trim().toLowerCase();

    // Map common aliases
    let resolvedId: OccasionId = 'diwali';
    if (raw === 'birthday' || raw === 'bday' || raw === 'cake') {
      resolvedId = 'birthday';
    } else if (raw === 'wedding' || raw === 'marriage' || raw === 'engagement' || raw === 'anniversary' || raw === 'love') {
      resolvedId = 'wedding';
    } else if (raw === 'newyear' || raw === 'ny' || raw === 'new-year' || raw === 'countdown' || raw === '2026') {
      resolvedId = 'newyear';
    } else if (raw === 'diwali' || raw === 'diya' || raw === 'deepavali' || raw === 'diya-classic') {
      resolvedId = 'diwali';
    }

    const theme = this.themes.get(resolvedId) || this.themes.get(this.defaultThemeId);
    if (!theme) {
      throw new Error(`ThemeRegistry: No theme registered for '${resolvedId}', and default '${this.defaultThemeId}' is missing.`);
    }
    return theme;
  }

  /**
   * Clears all registered themes (primarily for testing).
   */
  public clear(): void {
    this.themes.clear();
  }
}
