import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export const THEME_PALETTES = [
  'original',
  'midnight-neon',
  'obsidian-glow',
  'aurora-pulse',
  'solar-flare',
  'ocean-glass',
  'velvet-ember',
  'cyber-lime',
] as const;

export type ThemePalette = (typeof THEME_PALETTES)[number];
export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly renderer: Renderer2;
  private paletteValue: ThemePalette = 'original';
  private modeValue: ThemeMode = 'dark';

  readonly palettes = [...THEME_PALETTES];

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadInitial();
  }

  get palette(): ThemePalette {
    return this.paletteValue;
  }

  get mode(): ThemeMode {
    return this.modeValue;
  }

  setTheme(palette: ThemePalette): void {
    this.paletteValue = palette;
    this.apply();
  }

  setMode(mode: ThemeMode): void {
    this.modeValue = mode;
    this.apply();
  }

  toggleMode(): void {
    this.setMode(this.modeValue === 'dark' ? 'light' : 'dark');
  }

  cyclePalette(): ThemePalette {
    const currentIndex = this.palettes.indexOf(this.paletteValue);
    const nextIndex = (currentIndex + 1) % this.palettes.length;
    const nextPalette = this.palettes[nextIndex];
    this.setTheme(nextPalette);
    return nextPalette;
  }

  private loadInitial(): void {
    const storedPalette = localStorage.getItem('theme-palette');
    const storedMode = localStorage.getItem('theme-mode');

    if (storedPalette && this.isThemePalette(storedPalette)) {
      this.paletteValue = storedPalette;
    }

    if (storedMode === 'light' || storedMode === 'dark') {
      this.modeValue = storedMode;
    }

    this.apply();
  }

  private apply(): void {
    const root = document.documentElement;
    this.renderer.setAttribute(root, 'data-theme', this.paletteValue);
    this.renderer.setAttribute(root, 'data-mode', this.modeValue);
    localStorage.setItem('theme-palette', this.paletteValue);
    localStorage.setItem('theme-mode', this.modeValue);
  }

  private isThemePalette(value: string): value is ThemePalette {
    return this.palettes.includes(value as ThemePalette);
  }
}