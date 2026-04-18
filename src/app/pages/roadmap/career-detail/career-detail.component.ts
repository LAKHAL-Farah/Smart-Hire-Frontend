import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Career, CareerStep } from '../roadmap.component';

interface Point {
  x: number;
  y: number;
}

interface DetailIsland {
  step: CareerStep;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  landPath: string;
  isletPaths: string[];
  crackPaths: string[];
  highlandCx: number;
  highlandCy: number;
  highlandRx: number;
  highlandRy: number;
  gradientCx: number;
  gradientCy: number;
}

interface IslandTemplate {
  path: string;
  islets: string[];
  highland: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  };
  cracks: string[];
}

interface SvgParticle {
  x: number;
  y: number;
  radius: number;
  duration: number;
  delay: number;
  drift: number;
}

interface DecorativeIsland {
  path: string;
  opacity: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface WakeLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

interface CanvasParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  drift: number;
}

type NodeIconType =
  | 'math'
  | 'code'
  | 'database'
  | 'shield'
  | 'cloud'
  | 'rocket'
  | 'gear'
  | 'certificate';

const ISLAND_TEMPLATES: Record<string, IslandTemplate> = {
  ai: {
    path: 'M 60,40 C 80,10 140,5 180,25 C 220,45 250,30 260,60 C 270,90 255,110 230,120 C 210,130 195,125 185,140 C 175,155 180,170 160,175 C 140,180 110,170 90,160 C 70,150 40,155 30,140 C 15,125 10,100 20,80 C 30,60 40,70 60,40 Z',
    islets: [
      'M 230,150 C 238,145 248,148 250,155 C 252,162 244,167 237,165 C 230,163 222,157 230,150 Z',
      'M 195,164 C 202,159 212,161 214,168 C 216,175 208,180 200,178 C 193,176 188,170 195,164 Z'
    ],
    highland: { cx: 146, cy: 84, rx: 35, ry: 22 },
    cracks: [
      'M 120,88 C 126,96 138,93 146,101',
      'M 168,102 C 174,109 184,106 192,114',
      'M 96,122 C 104,129 116,126 124,134'
    ]
  },
  cloud: {
    path: 'M 40,70 C 50,30 100,10 150,20 C 195,30 230,20 250,45 C 265,65 260,85 245,95 C 235,102 220,95 215,110 C 210,125 220,140 210,155 C 200,168 180,165 165,155 C 155,148 155,135 145,130 C 135,125 120,135 108,130 C 96,125 90,110 80,108 C 68,106 50,115 38,105 C 22,92 28,80 40,70 Z',
    islets: [
      'M 232,162 C 240,156 251,159 253,167 C 255,175 246,181 238,178 C 230,176 224,168 232,162 Z',
      'M 62,150 C 69,144 80,146 82,154 C 84,162 76,167 68,165 C 61,163 55,157 62,150 Z'
    ],
    highland: { cx: 142, cy: 90, rx: 35, ry: 22 },
    cracks: [
      'M 110,86 C 117,95 129,93 138,101',
      'M 170,78 C 178,85 188,84 196,92',
      'M 86,120 C 94,127 104,124 112,132'
    ]
  },
  devops: {
    path: 'M 50,55 C 70,20 130,15 175,30 C 215,44 240,40 250,65 C 258,85 245,100 230,105 C 218,108 205,100 195,112 C 185,124 192,140 178,148 C 162,157 140,150 125,155 C 110,160 100,155 88,148 C 74,140 60,148 48,138 C 32,126 28,105 35,85 C 40,68 32,72 50,55 Z',
    islets: [
      'M 255,115 C 260,110 268,112 268,118 C 268,124 260,126 255,122 C 251,118 250,120 255,115 Z',
      'M 30,155 C 35,150 43,153 42,160 C 41,166 33,167 29,162 C 26,158 26,160 30,155 Z',
      'M 214,156 C 220,151 229,153 231,160 C 233,167 226,171 218,169 C 212,167 208,161 214,156 Z'
    ],
    highland: { cx: 142, cy: 88, rx: 34, ry: 22 },
    cracks: [
      'M 112,90 C 120,98 132,96 140,104',
      'M 164,106 C 172,114 183,111 191,118',
      'M 92,122 C 99,128 109,126 117,133'
    ]
  },
  frontend: {
    path: 'M 100,20 C 140,8 200,15 225,45 C 248,72 245,105 230,130 C 215,155 195,168 175,175 C 155,182 130,178 115,165 C 100,152 95,135 88,118 C 80,100 70,90 65,72 C 58,52 62,32 100,20 Z',
    islets: [
      'M 228,80 C 245,72 262,75 265,85 C 268,96 255,103 242,100 C 232,97 220,92 228,80 Z',
      'M 86,170 C 92,164 102,166 104,173 C 106,180 98,184 90,182 C 84,180 80,175 86,170 Z'
    ],
    highland: { cx: 162, cy: 92, rx: 35, ry: 21 },
    cracks: [
      'M 150,82 C 158,90 170,88 178,96',
      'M 120,112 C 128,120 141,118 149,126',
      'M 176,126 C 184,133 194,132 202,139'
    ]
  },
  backend: {
    path: 'M 35,80 C 40,40 80,15 125,18 C 165,20 200,15 230,35 C 255,52 260,80 250,105 C 242,125 225,130 208,125 C 194,121 185,108 175,115 C 162,124 160,145 145,150 C 130,155 110,150 98,140 C 86,130 88,115 75,110 C 62,105 42,112 32,100 C 20,86 28,95 35,80 Z',
    islets: [
      'M 220,150 C 228,144 239,146 241,154 C 243,162 235,167 227,165 C 219,163 213,157 220,150 Z',
      'M 64,152 C 71,146 82,148 84,156 C 86,164 78,169 70,167 C 63,165 57,159 64,152 Z'
    ],
    highland: { cx: 138, cy: 88, rx: 34, ry: 22 },
    cracks: [
      'M 108,86 C 116,94 128,92 136,100',
      'M 166,96 C 174,104 186,101 194,109',
      'M 96,124 C 103,131 114,129 122,136'
    ]
  },
  security: {
    path: 'M 75,35 C 100,12 150,8 185,28 C 215,45 235,42 245,70 C 253,92 248,115 235,128 C 225,138 210,135 200,148 C 190,160 195,175 178,180 C 158,185 130,178 112,168 C 95,158 88,140 72,135 C 54,130 35,138 28,120 C 18,98 25,70 45,55 C 58,44 52,55 75,35 Z',
    islets: [
      'M 216,160 C 224,154 234,156 236,164 C 238,172 230,176 222,174 C 214,172 208,166 216,160 Z',
      'M 52,154 C 59,148 70,150 72,158 C 74,166 66,171 58,169 C 51,167 45,161 52,154 Z'
    ],
    highland: { cx: 144, cy: 90, rx: 34, ry: 22 },
    cracks: [
      'M 118,84 C 126,92 138,90 146,98',
      'M 172,110 C 180,118 191,115 199,123',
      'M 98,122 C 106,130 117,128 125,136'
    ]
  }
};

@Component({
  selector: 'app-career-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-detail.component.html',
  styleUrl: './career-detail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CareerDetailComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true })
  career!: Career;

  @Output() back = new EventEmitter<void>();

  @Output() toggleStepDone = new EventEmitter<number>();

  @ViewChild('fogCanvas', { static: true })
  fogCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('stepList')
  stepListRef?: ElementRef<HTMLElement>;

  selectedStepId: number | null = null;
  hoveredIslandId: number | null = null;

  readonly contourScales = [0.75, 0.5, 0.28];

  readonly sceneWidth = 1200;
  readonly sceneHeight = 700;
  readonly islandPositions: Point[] = [
    { x: 150, y: 560 },
    { x: 320, y: 430 },
    { x: 200, y: 300 },
    { x: 420, y: 200 },
    { x: 620, y: 310 },
    { x: 820, y: 180 },
    { x: 1000, y: 280 }
  ];

  readonly depthPools = [
    { cx: 280, cy: 130, rx: 260, ry: 180, opacity: 0.23 },
    { cx: 780, cy: 260, rx: 340, ry: 220, opacity: 0.16 },
    { cx: 940, cy: 540, rx: 300, ry: 220, opacity: 0.18 },
    { cx: 180, cy: 500, rx: 220, ry: 180, opacity: 0.15 }
  ];

  detailIslands: DetailIsland[] = [];
  decorativeIslands: DecorativeIsland[] = [];
  clouds: Cloud[] = [];
  wakeLines: WakeLine[] = [];
  svgParticles: SvgParticle[] = [];
  routePath = '';

  compassCenter = { x: 1110, y: 620, radius: 38 };
  compassSpokes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  private canvasParticles: CanvasParticle[] = [];
  private canvasAnimationFrame: number | null = null;
  private readonly resizeHandler = (): void => this.resizeCanvas();

  get completedCount(): number {
    return this.career.steps.filter((step) => step.done).length;
  }

  get totalCount(): number {
    return this.career.steps.length;
  }

  get progressPercent(): number {
    if (!this.totalCount) {
      return 0;
    }
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  get routeDashClass(): string {
    return `route-dash-${this.career.id}`;
  }

  get routeTravelDuration(): string {
    const durationMap: Record<string, number> = {
      ai: 4.4,
      cloud: 4.9,
      devops: 4.6,
      frontend: 4,
      backend: 4.3,
      security: 5.1
    };
    return `${durationMap[this.career.id] ?? 4.6}s`;
  }

  get routeStartPoint(): Point | null {
    const first = this.detailIslands[0];
    if (!first) {
      return null;
    }

    return { x: first.x, y: first.y };
  }

  get routeFinishPoint(): Point | null {
    const last = this.detailIslands[this.detailIslands.length - 1];
    if (!last) {
      return null;
    }

    return { x: last.x, y: last.y };
  }

  ngAfterViewInit(): void {
    this.startCanvasLayer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['career'] && this.career) {
      this.buildScene();
    }
  }

  ngOnDestroy(): void {
    if (this.canvasAnimationFrame !== null) {
      cancelAnimationFrame(this.canvasAnimationFrame);
      this.canvasAnimationFrame = null;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  onBack(): void {
    this.back.emit();
  }

  onToggleStep(stepId: number): void {
    this.toggleStepDone.emit(stepId);
    window.requestAnimationFrame(() => {
      this.scrollStepIntoView(stepId);
    });
  }

  selectStep(stepId: number, scrollIntoPanel = true): void {
    this.selectedStepId = stepId;

    if (scrollIntoPanel) {
      this.scrollStepIntoView(stepId);
    }
  }

  setIslandHover(stepId: number | null): void {
    this.hoveredIslandId = stepId;
  }

  islandTransform(island: DetailIsland): string {
    const selectedScale = this.selectedStepId === island.step.id ? 1.08 : 1;
    const hoverScale = this.hoveredIslandId === island.step.id ? 1.03 : 1;
    const scale = selectedScale * hoverScale;
    return `translate(${island.x} ${island.y}) scale(${scale})`;
  }

  strokeColor(step: CareerStep): string {
    if (step.done) {
      return '#00ff88';
    }

    if (step.major) {
      return '#ff6b00';
    }

    return this.career.color;
  }

  islandGradientId(island: DetailIsland): string {
    return `terrain-${this.career.id}-${island.step.id}`;
  }

  highlandGradientId(island: DetailIsland): string {
    return `highland-${this.career.id}-${island.step.id}`;
  }

  islandGradientCx(island: DetailIsland): string {
    const shift = this.hoveredIslandId === island.step.id ? 4 : 0;
    return `${this.clamp(island.gradientCx + shift, 18, 82)}%`;
  }

  islandGradientCy(island: DetailIsland): string {
    const shift = this.hoveredIslandId === island.step.id ? 2 : 0;
    return `${this.clamp(island.gradientCy - shift, 20, 80)}%`;
  }

  contourTransform(island: DetailIsland, scale: number): string {
    return `translate(0 0) scale(${scale})`;
  }

  stepIconType(step: CareerStep): NodeIconType {
    const text = `${step.title} ${step.desc}`.toLowerCase();

    if (text.includes('math') || text.includes('algebra') || text.includes('calculus') || text.includes('statistics') || text.includes('probability')) {
      return 'math';
    }
    if (text.includes('database') || text.includes('sql') || text.includes('mongo') || text.includes('data')) {
      return 'database';
    }
    if (text.includes('security') || text.includes('auth') || text.includes('owasp') || text.includes('threat') || text.includes('soc')) {
      return 'shield';
    }
    if (text.includes('cloud') || text.includes('aws') || text.includes('platform')) {
      return 'cloud';
    }
    if (text.includes('deploy') || text.includes('ship') || text.includes('portfolio') || text.includes('project') || text.includes('ctf')) {
      return 'rocket';
    }
    if (text.includes('ops') || text.includes('pipeline') || text.includes('monitor') || text.includes('infra') || text.includes('ci/cd') || text.includes('k8s') || text.includes('container')) {
      return 'gear';
    }
    if (text.includes('cert') || text.includes('comptia') || text.includes('exam')) {
      return 'certificate';
    }

    return 'code';
  }

  private buildScene(): void {
    const rng = this.makeRng(this.hash(this.career.id));
    const templateKeys = this.templateSequenceForCareer(this.career.id);

    this.detailIslands = this.career.steps.map((step, index) => {
      const position = this.islandPositions[index] ?? {
        x: 160 + index * 120,
        y: 560 - index * 48
      };
      const isFinal = index === this.career.steps.length - 1;
      const width = isFinal ? 140 : 82 + (index % 3) * 10;
      const height = isFinal ? 104 : 56 + (index % 2) * 10;

      const templateKey = templateKeys[index % templateKeys.length];
      const template = ISLAND_TEMPLATES[templateKey] ?? ISLAND_TEMPLATES['ai'];

      const scaleX = width / 248;
      const scaleY = height / 178;
      const tx = -140 * scaleX;
      const ty = -100 * scaleY;

      return {
        step,
        index,
        x: position.x,
        y: position.y,
        width,
        height,
        landPath: this.transformPath(template.path, scaleX, scaleY, tx, ty),
        isletPaths: template.islets.map((isletPath) => this.transformPath(isletPath, scaleX, scaleY, tx, ty)),
        crackPaths: template.cracks.map((crackPath) => this.transformPath(crackPath, scaleX, scaleY, tx, ty)),
        highlandCx: template.highland.cx * scaleX + tx,
        highlandCy: template.highland.cy * scaleY + ty,
        highlandRx: template.highland.rx * scaleX,
        highlandRy: template.highland.ry * scaleY,
        gradientCx: 30 + rng() * 28,
        gradientCy: 26 + rng() * 26
      };
    });

    this.routePath = this.buildRoutePath(this.detailIslands.map((island) => ({ x: island.x, y: island.y })));
    this.decorativeIslands = this.createDecorativeIslands(rng);
    this.clouds = this.createClouds(rng);
    this.wakeLines = this.createWakeLines();
    this.svgParticles = this.createSvgParticles(rng);
    this.compassSpokes = this.createCompassSpokes();

    if (!this.selectedStepId || !this.career.steps.some((step) => step.id === this.selectedStepId)) {
      this.selectedStepId = this.career.steps[0]?.id ?? null;
    }
  }

  private templateSequenceForCareer(careerId: string): string[] {
    const baseOrder = ['ai', 'cloud', 'devops', 'frontend', 'backend', 'security'];
    const startIndex = Math.max(0, baseOrder.indexOf(careerId));
    return [...baseOrder.slice(startIndex), ...baseOrder.slice(0, startIndex)];
  }

  private transformPath(path: string, scaleX: number, scaleY: number, translateX: number, translateY: number): string {
    let isX = true;
    return path.replace(/-?\d*\.?\d+/g, (token) => {
      const numeric = Number(token);
      const transformed = isX
        ? numeric * scaleX + translateX
        : numeric * scaleY + translateY;
      isX = !isX;
      return Number(transformed.toFixed(2)).toString();
    });
  }

  private createDecorativeIslands(rng: () => number): DecorativeIsland[] {
    return Array.from({ length: 5 }, () => {
      const x = 110 + rng() * 970;
      const y = 80 + rng() * 550;
      const template = ISLAND_TEMPLATES['cloud'];
      const path = this.transformPath(template.path, 0.12 + rng() * 0.06, 0.1 + rng() * 0.06, x - 140 * 0.14, y - 100 * 0.12);
      return {
        path,
        opacity: 0.22 + rng() * 0.18
      };
    });
  }

  private createClouds(rng: () => number): Cloud[] {
    return Array.from({ length: 3 }, () => {
      return {
        x: 160 + rng() * 850,
        y: 40 + rng() * 120,
        width: 60 + rng() * 80,
        height: 16 + rng() * 16,
        opacity: 0.09 + rng() * 0.08
      };
    });
  }

  private createWakeLines(): WakeLine[] {
    if (this.detailIslands.length < 2) {
      return [];
    }

    const first = this.detailIslands[0];
    const second = this.detailIslands[1];

    return Array.from({ length: 4 }, (_, index) => {
      const t = 0.08 + index * 0.04;
      const x = first.x + (second.x - first.x) * t;
      const y = first.y + (second.y - first.y) * t;
      return {
        x1: x - 12,
        y1: y + index * 3,
        x2: x + 12,
        y2: y + index * 3 + 3,
        opacity: 0.22 - index * 0.04
      };
    });
  }

  private createSvgParticles(rng: () => number): SvgParticle[] {
    return Array.from({ length: 30 }, () => {
      return {
        x: 30 + rng() * 1140,
        y: 20 + rng() * 660,
        radius: 0.8 + rng() * 1.6,
        duration: 8 + rng() * 10,
        delay: -rng() * 8,
        drift: 18 + rng() * 35
      };
    });
  }

  private createCompassSpokes(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    const spokes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const inner = this.compassCenter.radius * 0.36;
      const outer = this.compassCenter.radius;
      spokes.push({
        x1: this.compassCenter.x + Math.cos(angle) * inner,
        y1: this.compassCenter.y + Math.sin(angle) * inner,
        x2: this.compassCenter.x + Math.cos(angle) * outer,
        y2: this.compassCenter.y + Math.sin(angle) * outer
      });
    }

    return spokes;
  }

  private buildRoutePath(points: Point[]): string {
    if (!points.length) {
      return '';
    }

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let index = 1; index < points.length; index += 1) {
      const prev = points[index - 1];
      const current = points[index];
      const dx = current.x - prev.x;
      const wave = index % 2 === 0 ? -42 : 42;

      const cp1x = prev.x + dx * 0.34;
      const cp1y = prev.y + wave * 0.35;
      const cp2x = prev.x + dx * 0.68;
      const cp2y = current.y - wave * 0.22;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
    }

    return d;
  }

  private startCanvasLayer(): void {
    this.resizeCanvas();
    this.canvasParticles = this.createCanvasParticles();
    this.animateCanvas();
    window.addEventListener('resize', this.resizeHandler);
  }

  private createCanvasParticles(): CanvasParticle[] {
    const width = this.fogCanvasRef.nativeElement.clientWidth;
    const height = this.fogCanvasRef.nativeElement.clientHeight;
    const rng = this.makeRng(this.hash(`${this.career.id}-canvas`));

    return Array.from({ length: 38 }, () => {
      return {
        x: rng() * width,
        y: rng() * height,
        size: 0.8 + rng() * 2.1,
        alpha: 0.15 + rng() * 0.3,
        speed: 0.15 + rng() * 0.35,
        drift: (rng() - 0.5) * 0.2
      };
    });
  }

  private animateCanvas = (): void => {
    const canvas = this.fogCanvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    context.clearRect(0, 0, width, height);

    for (const particle of this.canvasParticles) {
      context.beginPath();
      context.fillStyle = `rgba(146, 217, 255, ${particle.alpha})`;
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();

      particle.y -= particle.speed;
      particle.x += Math.sin(particle.y * 0.01) * particle.drift;

      if (particle.y < -8) {
        particle.y = height + 8;
      }
      if (particle.x < -10) {
        particle.x = width + 8;
      }
      if (particle.x > width + 10) {
        particle.x = -8;
      }
    }

    this.canvasAnimationFrame = requestAnimationFrame(this.animateCanvas);
  };

  private resizeCanvas(): void {
    const canvas = this.fogCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const context = canvas.getContext('2d');
    if (context) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private scrollStepIntoView(stepId: number): void {
    const listElement = this.stepListRef?.nativeElement;
    if (!listElement) {
      return;
    }

    const row = listElement.querySelector<HTMLElement>(`[data-step-id="${stepId}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private hash(value: string): number {
    let hashed = 0;
    for (let index = 0; index < value.length; index += 1) {
      hashed = (hashed << 5) - hashed + value.charCodeAt(index);
      hashed |= 0;
    }

    return Math.abs(hashed);
  }

  private makeRng(seed: number): () => number {
    let state = seed % 2147483647;
    if (state <= 0) {
      state += 2147483646;
    }

    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}