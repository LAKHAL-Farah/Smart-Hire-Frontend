import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AssessmentAdminApiService,
  AssessmentSessionAdminRow,
  CategoryAdminRow,
  SessionResultAdminDto,
  AddAssessmentsRequest,
} from "../../service/assessment-admin-api.service";

export interface UserRow {
  userId: string;
  displayName: string | null;
  situation: string | null;
  careerPath: string | null;
  customSituation: string | null;
  customCareerPath: string | null;
  headline: string | null;
  isPending: boolean;
  sessionCount: number;
  avgScore: number;
  sessions: AssessmentSessionAdminRow[];
}

@Component({
  selector: "app-user-detail-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: "./user-detail-modal.component.html",
  styleUrl: "./user-detail-modal.component.scss",
})
export class UserDetailModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() user: UserRow | null = null;
  @Input() allCategories: CategoryAdminRow[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() reviewSession = new EventEmitter<number>();
  @Output() publishSession = new EventEmitter<AssessmentSessionAdminRow>();
  @Output() deleteSession = new EventEmitter<AssessmentSessionAdminRow>();
  @Output() refreshNeeded = new EventEmitter<void>();

  private api = inject(AssessmentAdminApiService);

  assignedAssessments: { id: number; code: string; title: string; completed: boolean }[] = [];
  assignedLoading = false;

  showAddPanel = false;
  selectedCatIds: number[] = [];
  suggestedIds: number[] = [];
  suggestLoading = false;
  suggestMsg = "";
  saving = false;
  saveMsg = "";
  saveMsgType: "success" | "error" | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["isOpen"] && this.isOpen && this.user) {
      this.reset();
      this.loadAssigned();
    }
  }

  get initials(): string {
    const n = this.user?.displayName || this.user?.userId || "?";
    return n.slice(0, 2).toUpperCase();
  }

  get pendingAssessments(): { id: number; code: string; title: string; completed: boolean }[] {
    return this.assignedAssessments.filter((a) => !a.completed);
  }

  get availableToAdd(): CategoryAdminRow[] {
    const ids = new Set(this.assignedAssessments.map((a) => a.id));
    return this.allCategories.filter((c) => !ids.has(c.id));
  }

  isSelected(id: number): boolean { return this.selectedCatIds.includes(id); }
  isSuggested(id: number): boolean { return this.suggestedIds.includes(id); }

  toggleCat(id: number): void {
    const i = this.selectedCatIds.indexOf(id);
    if (i >= 0) this.selectedCatIds.splice(i, 1);
    else this.selectedCatIds.push(id);
  }

  situationLabel(s: string | null): string {
    const m: Record<string, string> = { student: "Student", junior: "Junior", switcher: "Switcher", experienced: "Experienced", other: "Other" };
    return s ? (m[s] ?? s) : "";
  }

  careerLabel(c: string | null): string {
    const m: Record<string, string> = { backend: "Backend", frontend: "Frontend", fullstack: "Full-stack", devops: "DevOps", data: "Data/AI", senior: "Senior/Lead", other: "Other" };
    return c ? (m[c] ?? c) : "";
  }

  scoreClass(score: number | null): string {
    if (score === null || score === undefined) return "";
    if (score >= 80) return "high";
    if (score >= 50) return "mid";
    return "low";
  }

  private reset(): void {
    this.assignedAssessments = [];
    this.showAddPanel = false;
    this.selectedCatIds = [];
    this.suggestedIds = [];
    this.suggestMsg = "";
    this.saveMsg = "";
    this.saveMsgType = null;
    this.saving = false;
  }

  private loadAssigned(): void {
    if (!this.user) return;
    this.assignedLoading = true;
    this.api.getUserAssignedAssessments(this.user.userId).subscribe({
      next: (d) => { this.assignedAssessments = d; this.assignedLoading = false; },
      error: () => { this.assignedLoading = false; },
    });
  }

  openAddPanel(): void {
    this.showAddPanel = true;
    this.selectedCatIds = [];
    this.suggestedIds = [];
    this.suggestMsg = "";
    this.saveMsg = "";
    this.saveMsgType = null;
  }

  onSuggest(): void {
    if (!this.user) return;
    this.suggestLoading = true;
    this.suggestMsg = "";
    this.api.suggestCategoriesWithHistory(this.user.userId).subscribe({
      next: (r) => {
        this.suggestedIds = r.suggestedCategories.map((c) => c.id);
        const avail = new Set(this.availableToAdd.map((c) => c.id));
        this.suggestedIds.forEach((id) => { if (avail.has(id) && !this.isSelected(id)) this.selectedCatIds.push(id); });
        this.suggestMsg = `AI suggested ${this.suggestedIds.length} assessment(s)`;
        this.suggestLoading = false;
      },
      error: () => { this.suggestMsg = "AI unavailable — select manually"; this.suggestLoading = false; },
    });
  }

  onSave(): void {
    if (!this.user || this.selectedCatIds.length === 0) return;
    this.saving = true;
    this.saveMsg = "";
    this.saveMsgType = null;
    const req: AddAssessmentsRequest = { categoryIds: this.selectedCatIds };
    this.api.addAssessmentsToUser(this.user.userId, req).subscribe({
      next: () => {
        this.saving = false;
        this.saveMsg = `${this.selectedCatIds.length} assessment(s) assigned!`;
        this.saveMsgType = "success";
        this.selectedCatIds = [];
        this.suggestedIds = [];
        this.refreshNeeded.emit();
        this.loadAssigned();
        setTimeout(() => { this.showAddPanel = false; this.saveMsg = ""; }, 2000);
      },
      error: (e: any) => {
        this.saving = false;
        this.saveMsg = e?.error?.message || "Failed to assign";
        this.saveMsgType = "error";
      },
    });
  }
}
