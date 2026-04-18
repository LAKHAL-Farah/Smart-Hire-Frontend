import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { Career, CareerStep } from '../roadmap.component';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  duration: number;
  delay: number;
  drift: number;
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

interface IslandShape {
  id: string;
  cx: number;
  cy: number;
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

interface CardScene {
  mainIsland: IslandShape;
  waypoints: Point[];
  polylinePoints: string;
  routePath: string;
  particles: Particle[];
  startPoint: Point;
  finishPoint: Point;
}

interface CardVisualProfile {
  rating: string;
  tagline: string;
  tags: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  distance: string;
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

const CARD_VISUALS: Record<string, CardVisualProfile> = {
  ai: {
    rating: '4.9',
    tagline: 'Modeling, inference, and deployment across intelligent systems.',
    tags: ['ML', 'LLM'],
    difficulty: 'ADVANCED',
    distance: '7 SECTORS'
  },
  cloud: {
    rating: '4.8',
    tagline: 'Operate resilient multi-region platforms with automation.',
    tags: ['AWS', 'IaC'],
    difficulty: 'INTERMEDIATE',
    distance: '7 SECTORS'
  },
  devops: {
    rating: '4.7',
    tagline: 'Ship faster with observability, reliability, and pipelines.',
    tags: ['CI/CD', 'SRE'],
    difficulty: 'ADVANCED',
    distance: '7 SECTORS'
  },
  frontend: {
    rating: '4.6',
    tagline: 'Craft high-performance interfaces with precision UX polish.',
    tags: ['UI', 'TS'],
    difficulty: 'BEGINNER',
    distance: '7 SECTORS'
  },
  backend: {
    rating: '4.8',
    tagline: 'Design scalable APIs, data systems, and secure services.',
    tags: ['API', 'Data'],
    difficulty: 'INTERMEDIATE',
    distance: '7 SECTORS'
  },
  security: {
    rating: '4.9',
    tagline: 'Defend infrastructure with attack simulation and blue-team ops.',
    tags: ['SOC', 'Red/Blue'],
    difficulty: 'ADVANCED',
    distance: '7 SECTORS'
  }
};

@Component({
  selector: 'app-career-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-card.component.html',
  styleUrl: './career-card.component.scss'
})
export class CareerCardComponent implements OnChanges {
  @Input({ required: true })
  career!: Career;

  @Output() explore = new EventEmitter<void>();

  scene: CardScene | null = null;
  isIslandHovered = false;

  readonly contourScales = [0.75, 0.5, 0.28];

  private lightShift = 0;

  get visualProfile(): CardVisualProfile {
    return CARD_VISUALS[this.career.id] ?? {
      rating: '4.7',
      tagline: 'Master a complete production path from fundamentals to shipping.',
      tags: ['Core', 'Portfolio'],
      difficulty: 'INTERMEDIATE',
      distance: `${this.career.steps.length} SECTORS`
    };
  }

  get routeDashClass(): string {
    return `route-dash-${this.career.id}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['career'] && this.career) {
      this.scene = this.buildScene(this.career);
    }
  }

  onExplore(): void {
    this.explore.emit();
  }

  setIslandHover(value: boolean): void {
    this.isIslandHovered = value;
    this.lightShift = value ? 4 : 0;
  }

  islandGradientCx(island: IslandShape): string {
    const shifted = this.clamp(island.gradientCx + this.lightShift, 18, 82);
    return `${shifted}%`;
  }

  islandGradientCy(island: IslandShape): string {
    const shifted = this.clamp(island.gradientCy - this.lightShift * 0.4, 20, 80);
    return `${shifted}%`;
  }

  islandGradientId(island: IslandShape): string {
    return `terrain-${island.id}`;
  }

  highlandGradientId(island: IslandShape): string {
    return `highland-${island.id}`;
  }

  contourTransform(island: IslandShape, scale: number): string {
    return `translate(${island.cx} ${island.cy}) scale(${scale}) translate(${-island.cx} ${-island.cy})`;
  }

  nodeIconType(index: number): NodeIconType {
    const step = this.stepForWaypoint(index);
    if (!step) {
      return 'code';
    }

    return this.resolveStepType(step);
  }

  isMajorWaypoint(index: number): boolean {
    return this.stepForWaypoint(index)?.major ?? false;
  }

  routeTravelDuration(): string {
    const durationMap: Record<string, number> = {
      ai: 4,
      cloud: 4.6,
      devops: 4.2,
      frontend: 3.8,
      backend: 4.1,
      security: 4.8
    };
    return `${durationMap[this.career.id] ?? 4.4}s`;
  }

  trackByPoint(_: number, point: Point): string {
    return `${point.x}-${point.y}`;
  }

  private buildScene(career: Career): CardScene {
    const seed = this.hash(career.id);
    const rng = this.makeRng(seed);
    const template = ISLAND_TEMPLATES[career.id] ?? ISLAND_TEMPLATES['ai'];

    const mainIsland = this.createIslandShape(`${career.id}-main`, template, 154 + rng() * 10, 114 + rng() * 8, 0.76, 0.72, rng);

    const waypointCount = 5;
    const waypoints: Point[] = [];

    for (let index = 0; index < waypointCount; index += 1) {
      const t = index / (waypointCount - 1);
      const x = 40 + t * 248 + (rng() - 0.5) * 22;
      const y = 186 - t * 106 + Math.sin(index * 1.28 + seed) * 22 + (rng() - 0.5) * 10;
      waypoints.push({ x: this.clamp(x, 24, 334), y: this.clamp(y, 24, 214) });
    }

    const particles: Particle[] = Array.from({ length: 18 }, () => {
      return {
        x: 12 + rng() * 336,
        y: 28 + rng() * 204,
        radius: 0.8 + rng() * 1.5,
        duration: 5 + rng() * 5,
        delay: -rng() * 6,
        drift: 5 + rng() * 18
      };
    });

    return {
      mainIsland,
      waypoints,
      polylinePoints: waypoints.map((point) => `${point.x},${point.y}`).join(' '),
      routePath: `M ${waypoints.map((point) => `${point.x} ${point.y}`).join(' L ')}`,
      particles,
      startPoint: waypoints[0],
      finishPoint: waypoints[waypoints.length - 1]
    };
  }

  private createIslandShape(
    id: string,
    template: IslandTemplate,
    targetCx: number,
    targetCy: number,
    scaleX: number,
    scaleY: number,
    rng: () => number
  ): IslandShape {
    const tx = targetCx - 140 * scaleX;
    const ty = targetCy - 100 * scaleY;

    return {
      id,
      cx: targetCx,
      cy: targetCy,
      landPath: this.transformPath(template.path, scaleX, scaleY, tx, ty),
      isletPaths: template.islets.map((isletPath) => this.transformPath(isletPath, scaleX, scaleY, tx, ty)),
      crackPaths: template.cracks.map((crackPath) => this.transformPath(crackPath, scaleX, scaleY, tx, ty)),
      highlandCx: template.highland.cx * scaleX + tx,
      highlandCy: template.highland.cy * scaleY + ty,
      highlandRx: template.highland.rx * scaleX,
      highlandRy: template.highland.ry * scaleY,
      gradientCx: 32 + rng() * 26,
      gradientCy: 28 + rng() * 24
    };
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

  private stepForWaypoint(index: number): CareerStep | undefined {
    const totalWaypoints = this.scene?.waypoints.length ?? 1;
    const totalSteps = this.career.steps.length;
    if (!totalSteps) {
      return undefined;
    }

    const ratio = totalWaypoints > 1 ? index / (totalWaypoints - 1) : 0;
    const mappedIndex = Math.round(ratio * (totalSteps - 1));
    return this.career.steps[this.clamp(mappedIndex, 0, totalSteps - 1)];
  }

  private resolveStepType(step: CareerStep): NodeIconType {
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