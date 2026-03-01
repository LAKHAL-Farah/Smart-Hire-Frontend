import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav
      class="fixed top-0 left-0 w-full z-50 transition-all duration-500"
      [class.scrolled]="isScrolled()"
    >
      <div class="section-container flex items-center justify-between h-[72px]">
        <!-- Logo -->
        <a href="#" class="flex items-center gap-2 text-white font-bold text-xl no-underline">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2ee8a5] to-[#3b82f6] flex items-center justify-center text-sm font-black text-[#0a0a0f]">
            S
          </div>
          <span class="font-display">SmartHire</span>
        </a>

        <!-- Center Links -->
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="nav-link">Features</a>
          <a href="#how-it-works" class="nav-link">How it works</a>
          <a href="#pricing" class="nav-link">Pricing</a>
          <a href="#testimonials" class="nav-link">For Students</a>
        </div>

        <!-- Right Actions -->
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="hidden sm:block text-[var(--text-secondary)] hover:text-white transition-colors text-sm font-medium no-underline px-4 py-2">
            Log in
          </a>
          <a routerLink="/register" class="btn-primary !py-2.5 !px-5 !text-sm no-underline">
            Get Started
          </a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          class="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-2"
          (click)="toggleMobile()"
        >
          <span class="block w-5 h-0.5 bg-white transition-transform" [class.rotate-45]="mobileOpen()" [class.translate-y-1]="mobileOpen()"></span>
          <span class="block w-5 h-0.5 bg-white transition-opacity" [class.opacity-0]="mobileOpen()"></span>
          <span class="block w-5 h-0.5 bg-white transition-transform" [class.-rotate-45]="mobileOpen()" [class.-translate-y-1]="mobileOpen()"></span>
        </button>
      </div>

      <!-- Mobile Menu -->
      @if (mobileOpen()) {
        <div class="md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] px-6 py-4 flex flex-col gap-3">
          <a href="#features" class="nav-link">Features</a>
          <a href="#how-it-works" class="nav-link">How it works</a>
          <a href="#pricing" class="nav-link">Pricing</a>
          <a href="#testimonials" class="nav-link">For Students</a>
        </div>
      }
    </nav>
  `,
  styles: [`
    :host { display: block; }

    nav {
      background: transparent;
    }

    nav.scrolled {
      background: rgba(10, 10, 15, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
    }

    .nav-link {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .nav-link:hover {
      color: var(--text-primary);
    }

    .font-display {
      font-family: var(--font-display);
    }
  `]
})
export class NavbarComponent {
  isScrolled = signal(false);
  mobileOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 100);
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }
}
