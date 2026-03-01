import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ══════════ INTERFACES ══════════ */

interface SettingsCategory {
  id: string;
  label: string;
  icon: string;
  group: number;          // for divider lines between groups
  danger?: boolean;       // red tint for Danger Zone
  dirty?: boolean;        // unsaved changes indicator
}

interface PlatformIdentity {
  name: string;
  url: string;
  supportEmail: string;
  contactEmail: string;
  defaultLanguage: string;
  defaultTimezone: string;
}

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedEnd: string;
}

interface LocalizationConfig {
  dateFormat: string;
  currency: string;
  availableLanguages: string[];
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnDestroy {

  /* ══════════ LEFT NAV CATEGORIES ══════════ */
  categories: SettingsCategory[] = [
    { id: 'general',        label: 'General',                    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z"/></svg>', group: 1 },
    { id: 'branding',       label: 'Branding',                   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>', group: 1 },
    { id: 'ai',             label: 'AI Configuration',           icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.92a1 1 0 0 0-.75.97V13"/><circle cx="12" cy="17" r="3"/><path d="M6.5 6A4.5 4.5 0 0 0 2 10.5c0 2 1.33 3.69 3.15 4.24"/><path d="M17.5 6A4.5 4.5 0 0 1 22 10.5c0 2-1.33 3.69-3.15 4.24"/></svg>', group: 2 },
    { id: 'email',          label: 'Email & Notifications',      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', group: 2 },
    { id: 'auth',           label: 'Authentication & Security',  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', group: 2 },
    { id: 'billing',        label: 'Subscription & Billing',     icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', group: 3 },
    { id: 'features',       label: 'Feature Flags',              icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>', group: 3 },
    { id: 'integrations',   label: 'Integrations',               icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>', group: 3 },
    { id: 'audit',          label: 'Audit Log',                  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', group: 4 },
    { id: 'danger',         label: 'Danger Zone',                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', group: 4, danger: true },
  ];

  activeCategory = 'general';

  /* ══════════ GENERAL — PLATFORM IDENTITY ══════════ */
  identity: PlatformIdentity = {
    name: 'SmartHire AI',
    url: 'smarthire.io',
    supportEmail: 'support@smarthire.io',
    contactEmail: 'contact@smarthire.io',
    defaultLanguage: 'en',
    defaultTimezone: 'UTC+1'
  };
  identitySnapshot = '';

  languageOptions = [
    { value: 'en', label: 'English (EN)' },
    { value: 'fr', label: 'French (FR)' },
    { value: 'de', label: 'German (DE)' },
    { value: 'es', label: 'Spanish (ES)' },
    { value: 'ar', label: 'Arabic (AR)' },
    { value: 'zh', label: 'Chinese (ZH)' },
    { value: 'ja', label: 'Japanese (JA)' },
    { value: 'pt', label: 'Portuguese (PT)' },
  ];

  timezoneOptions = [
    'UTC-12 — Baker Island',
    'UTC-8 — Pacific Time (US)',
    'UTC-7 — Mountain Time (US)',
    'UTC-6 — Central Time (US)',
    'UTC-5 — Eastern Time (US)',
    'UTC-3 — Buenos Aires',
    'UTC+0 — London / Lisbon',
    'UTC+1 — Central European Time',
    'UTC+2 — Eastern European Time',
    'UTC+3 — Moscow / Istanbul',
    'UTC+5:30 — India Standard Time',
    'UTC+8 — Singapore / Perth',
    'UTC+9 — Tokyo / Seoul',
    'UTC+10 — Sydney / Melbourne',
  ];

  /* ══════════ GENERAL — MAINTENANCE MODE ══════════ */
  maintenance: MaintenanceConfig = {
    enabled: false,
    message: 'We\\u2019re upgrading SmartHire \\u2014 back in 2 hours.',
    estimatedEnd: '2026-03-01T18:00'
  };
  maintenanceSnapshot = '';
  showMaintenanceModal = false;
  maintenanceConfirmText = '';

  /* ══════════ GENERAL — LOCALIZATION ══════════ */
  localization: LocalizationConfig = {
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    availableLanguages: ['English', 'French']
  };
  localizationSnapshot = '';

  dateFormatOptions = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
  currencyOptions = [
    { value: 'EUR', label: 'EUR — Euro (€)' },
    { value: 'USD', label: 'USD — US Dollar ($)' },
    { value: 'GBP', label: 'GBP — British Pound (£)' },
    { value: 'CHF', label: 'CHF — Swiss Franc' },
    { value: 'CAD', label: 'CAD — Canadian Dollar (C$)' },
    { value: 'AUD', label: 'AUD — Australian Dollar (A$)' },
    { value: 'JPY', label: 'JPY — Japanese Yen (¥)' },
  ];

  allLanguages = ['English', 'French', 'German', 'Spanish', 'Arabic', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Dutch', 'Korean', 'Russian'];
  newLanguageInput = '';
  showLanguageDropdown = false;

  /* ══════════ DIRTY / SAVE STATE ══════════ */
  dirtyCategories = new Set<string>();
  toast: Toast = { message: '', type: 'success', visible: false };
  private toastTimeout: any;

  /* ══════════ LIFECYCLE ══════════ */
  constructor() {
    this.snapshotAll();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  /* ══════════ SNAPSHOT HELPERS ══════════ */
  private snapshotAll(): void {
    this.identitySnapshot = JSON.stringify(this.identity);
    this.maintenanceSnapshot = JSON.stringify(this.maintenance);
    this.localizationSnapshot = JSON.stringify(this.localization);
  }

  private snapshotCategory(cat: string): void {
    if (cat === 'general') {
      this.identitySnapshot = JSON.stringify(this.identity);
      this.maintenanceSnapshot = JSON.stringify(this.maintenance);
      this.localizationSnapshot = JSON.stringify(this.localization);
    }
  }

  /* ══════════ DIRTY CHECK ══════════ */
  checkDirty(): void {
    const identityDirty = JSON.stringify(this.identity) !== this.identitySnapshot;
    const maintenanceDirty = JSON.stringify(this.maintenance) !== this.maintenanceSnapshot;
    const localizationDirty = JSON.stringify(this.localization) !== this.localizationSnapshot;

    if (identityDirty || maintenanceDirty || localizationDirty) {
      this.dirtyCategories.add('general');
    } else {
      this.dirtyCategories.delete('general');
    }
    this.syncCategoryDirtyFlags();
  }

  private syncCategoryDirtyFlags(): void {
    this.categories.forEach(c => c.dirty = this.dirtyCategories.has(c.id));
  }

  get isCurrentDirty(): boolean {
    return this.dirtyCategories.has(this.activeCategory);
  }

  /* ══════════ SAVE / DISCARD ══════════ */
  saveCategory(): void {
    this.snapshotCategory(this.activeCategory);
    this.dirtyCategories.delete(this.activeCategory);
    this.syncCategoryDirtyFlags();
    this.showToast('Settings saved successfully', 'success');
  }

  discardCategory(): void {
    if (this.activeCategory === 'general') {
      this.identity = JSON.parse(this.identitySnapshot);
      this.maintenance = JSON.parse(this.maintenanceSnapshot);
      this.localization = JSON.parse(this.localizationSnapshot);
    }
    this.dirtyCategories.delete(this.activeCategory);
    this.syncCategoryDirtyFlags();
  }

  /* ══════════ TOAST ══════════ */
  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type, visible: true };
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast.visible = false, 3500);
  }

  /* ══════════ CATEGORY NAV ══════════ */
  selectCategory(id: string): void {
    this.activeCategory = id;
  }

  shouldShowDivider(index: number): boolean {
    if (index === 0) return false;
    return this.categories[index].group !== this.categories[index - 1].group;
  }

  /* ══════════ MAINTENANCE MODE ══════════ */
  onMaintenanceToggle(): void {
    if (!this.maintenance.enabled) {
      // Turning ON — show confirmation modal
      this.showMaintenanceModal = true;
      this.maintenanceConfirmText = '';
    } else {
      // Turning OFF — just disable
      this.maintenance.enabled = false;
      this.checkDirty();
    }
  }

  confirmMaintenance(): void {
    this.maintenance.enabled = true;
    this.showMaintenanceModal = false;
    this.maintenanceConfirmText = '';
    this.checkDirty();
  }

  cancelMaintenance(): void {
    this.showMaintenanceModal = false;
    this.maintenanceConfirmText = '';
  }

  get maintenanceConfirmValid(): boolean {
    return this.maintenanceConfirmText === 'MAINTENANCE';
  }

  /* ══════════ LANGUAGE TAGS ══════════ */
  get filteredLanguageOptions(): string[] {
    const current = new Set(this.localization.availableLanguages.map(l => l.toLowerCase()));
    return this.allLanguages.filter(l =>
      !current.has(l.toLowerCase()) &&
      l.toLowerCase().includes(this.newLanguageInput.toLowerCase())
    );
  }

  addLanguage(lang: string): void {
    if (!this.localization.availableLanguages.includes(lang)) {
      this.localization.availableLanguages.push(lang);
      this.newLanguageInput = '';
      this.showLanguageDropdown = false;
      this.checkDirty();
    }
  }

  removeLanguage(index: number): void {
    this.localization.availableLanguages.splice(index, 1);
    this.checkDirty();
  }

  onLanguageInputFocus(): void {
    this.showLanguageDropdown = true;
  }

  onLanguageInputBlur(): void {
    // Delay to allow click on dropdown items
    setTimeout(() => this.showLanguageDropdown = false, 200);
  }
}
