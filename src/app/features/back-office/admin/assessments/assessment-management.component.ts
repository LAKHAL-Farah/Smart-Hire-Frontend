import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentService, Skill, Assessment, CareerPath, AssessmentQuestion, AssessmentAnswer } from '../../../../core/services/assessment.service';

@Component({
  selector: 'app-assessment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AssessmentService],
  templateUrl: './assessment-management.component.html',
  styleUrls: ['./assessment-management.component.scss']
})
export class AssessmentManagementComponent implements OnInit {

  // Skills
  skills: Skill[] = [];
  newSkill: Skill = { name: '', category: '', description: '' };
  editingSkillId: number | null = null;
  selectedSkillCategory = '';

  // Assessments
  assessments: Assessment[] = [];
  newAssessment: Assessment = { userId: 0, type: 'INITIAL' };
  editingAssessmentId: number | null = null;
  userIdFilter = '';
  filteredAssessments: Assessment[] = [];

  // Career Paths
  careerPaths: CareerPath[] = [];
  newCareerPath: CareerPath = { name: '', description: '', requiredSkills: '', targetRoles: '', averageSalary: 0 };
  editingCareerPathId: number | null = null;

  // Assessment Questions
  questions: AssessmentQuestion[] = [];
  newQuestion: AssessmentQuestion = { assessmentId: 0, questionText: '', category: '', difficulty: 1 };
  editingQuestionId: number | null = null;
  selectedAssessmentId: number = 0;

  // Assessment Answers
  answers: AssessmentAnswer[] = [];
  newAnswer: AssessmentAnswer = { assessmentQuestionId: 0, userId: 0, answerText: '', score: 0 };
  editingAnswerId: number | null = null;
  selectedQuestionId: number = 0;

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(private assessmentService: AssessmentService) { }

  ngOnInit(): void {
    this.loadSkills();
    this.loadAssessments();
    this.loadCareerPaths();
  }

  // ============ SKILLS ============
  loadSkills(): void {
    this.assessmentService.getAllSkills().subscribe({
      next: (data: Skill[]) => {
        this.skills = data;
        this.showSuccess('Skills loaded');
      },
      error: (err: any) => this.showError('Error loading skills: ' + err.message)
    });
  }

  createSkill(): void {
    if (!this.newSkill.name || !this.newSkill.category) {
      this.showError('Name and Category are required');
      return;
    }
    this.assessmentService.createSkill(this.newSkill).subscribe({
      next: (skill: Skill) => {
        this.skills.push(skill);
        this.newSkill = { name: '', category: '', description: '' };
        this.showSuccess('Skill created successfully');
      },
      error: (err: any) => this.showError('Error creating skill: ' + err.message)
    });
  }

  editSkill(skill: Skill): void {
    this.editingSkillId = skill.id || null;
    this.newSkill = { ...skill };
  }

  updateSkill(): void {
    if (!this.editingSkillId) return;
    if (!this.newSkill.name || !this.newSkill.category) {
      this.showError('Name and Category are required');
      return;
    }
    this.assessmentService.updateSkill(this.editingSkillId, this.newSkill).subscribe({
      next: (skill: Skill) => {
        const index = this.skills.findIndex(s => s.id === this.editingSkillId);
        if (index > -1) {
          this.skills[index] = skill;
        }
        this.newSkill = { name: '', category: '', description: '' };
        this.editingSkillId = null;
        this.showSuccess('Skill updated successfully');
      },
      error: (err: any) => this.showError('Error updating skill: ' + err.message)
    });
  }

  cancelEditSkill(): void {
    this.newSkill = { name: '', category: '', description: '' };
    this.editingSkillId = null;
  }

  deleteSkill(id: number | undefined): void {
    if (!id) return;
    this.assessmentService.deleteSkill(id).subscribe({
      next: () => {
        this.skills = this.skills.filter(s => s.id !== id);
        this.showSuccess('Skill deleted');
      },
      error: (err: any) => this.showError('Error deleting skill: ' + err.message)
    });
  }

  filterSkillsByCategory(): void {
    if (!this.selectedSkillCategory) {
      this.loadSkills();
      return;
    }
    this.assessmentService.getSkillsByCategory(this.selectedSkillCategory).subscribe({
      next: (data: Skill[]) => {
        this.skills = data;
        this.showSuccess('Skills filtered');
      },
      error: (err: any) => this.showError('Error filtering skills: ' + err.message)
    });
  }

  // ============ ASSESSMENTS ============
  loadAssessments(): void {
    this.assessmentService.getAllAssessments().subscribe({
      next: (data: Assessment[]) => {
        this.assessments = data;
        this.filteredAssessments = data;
        this.showSuccess('Assessments loaded');
      },
      error: (err: any) => this.showError('Error loading assessments: ' + err.message)
    });
  }

  createAssessment(): void {
    if (!this.newAssessment.userId) {
      this.showError('User ID is required');
      return;
    }
    this.assessmentService.createAssessment(this.newAssessment).subscribe({
      next: (assessment: Assessment) => {
        this.assessments.push(assessment);
        this.filteredAssessments = this.assessments;
        this.newAssessment = { userId: 0, type: 'INITIAL' };
        this.showSuccess('Assessment created');
      },
      error: (err: any) => this.showError('Error creating assessment: ' + err.message)
    });
  }

  editAssessment(assessment: Assessment): void {
    this.editingAssessmentId = assessment.id || null;
    this.newAssessment = { ...assessment };
  }

  updateAssessment(): void {
    if (!this.editingAssessmentId) return;
    if (!this.newAssessment.userId) {
      this.showError('User ID is required');
      return;
    }
    this.assessmentService.updateAssessment(this.editingAssessmentId, this.newAssessment).subscribe({
      next: (updated: Assessment) => {
        const index = this.assessments.findIndex(a => a.id === this.editingAssessmentId);
        if (index > -1) {
          this.assessments[index] = updated;
          this.filteredAssessments = this.assessments;
        }
        this.newAssessment = { userId: 0, type: 'INITIAL' };
        this.editingAssessmentId = null;
        this.showSuccess('Assessment updated successfully');
      },
      error: (err: any) => this.showError('Error updating assessment: ' + err.message)
    });
  }

  cancelEditAssessment(): void {
    this.newAssessment = { userId: 0, type: 'INITIAL' };
    this.editingAssessmentId = null;
  }

  filterAssessmentsByUser(): void {
    if (!this.userIdFilter) {
      this.filteredAssessments = this.assessments;
      return;
    }
    const userId = parseInt(this.userIdFilter);
    this.assessmentService.getAssessmentsByUserId(userId).subscribe({
      next: (data: Assessment[]) => {
        this.filteredAssessments = data;
        this.showSuccess('Assessments filtered');
      },
      error: (err: any) => this.showError('Error filtering assessments: ' + err.message)
    });
  }

  updateAssessmentStatus(id: number | undefined, status: string): void {
    if (!id) return;
    this.assessmentService.updateAssessmentStatus(id, status).subscribe({
      next: (updated: Assessment) => {
        const index = this.assessments.findIndex(a => a.id === id);
        if (index > -1) {
          this.assessments[index] = updated;
          this.filteredAssessments = this.assessments;
        }
        this.showSuccess('Assessment status updated');
      },
      error: (err: any) => this.showError('Error updating assessment: ' + err.message)
    });
  }

  deleteAssessment(id: number | undefined): void {
    if (!id) return;
    this.assessmentService.deleteAssessment(id).subscribe({
      next: () => {
        this.assessments = this.assessments.filter(a => a.id !== id);
        this.filteredAssessments = this.assessments;
        this.showSuccess('Assessment deleted');
      },
      error: (err: any) => this.showError('Error deleting assessment: ' + err.message)
    });
  }

  // ============ CAREER PATHS ============
  loadCareerPaths(): void {
    this.assessmentService.getAllCareerPaths().subscribe({
      next: (data: CareerPath[]) => {
        this.careerPaths = data;
        this.showSuccess('Career paths loaded');
      },
      error: (err: any) => this.showError('Error loading career paths: ' + err.message)
    });
  }

  createCareerPath(): void {
    if (!this.newCareerPath.name || !this.newCareerPath.averageSalary) {
      this.showError('Name and Average Salary are required');
      return;
    }
    this.assessmentService.createCareerPath(this.newCareerPath).subscribe({
      next: (cp: CareerPath) => {
        this.careerPaths.push(cp);
        this.newCareerPath = { name: '', description: '', requiredSkills: '', targetRoles: '', averageSalary: 0 };
        this.showSuccess('Career path created');
      },
      error: (err: any) => this.showError('Error creating career path: ' + err.message)
    });
  }

  editCareerPath(cp: CareerPath): void {
    this.editingCareerPathId = cp.id || null;
    this.newCareerPath = { ...cp };
  }

  updateCareerPath(): void {
    if (!this.editingCareerPathId) return;
    if (!this.newCareerPath.name || !this.newCareerPath.averageSalary) {
      this.showError('Name and Average Salary are required');
      return;
    }
    this.assessmentService.updateCareerPath(this.editingCareerPathId, this.newCareerPath).subscribe({
      next: (cp: CareerPath) => {
        const index = this.careerPaths.findIndex(c => c.id === this.editingCareerPathId);
        if (index > -1) {
          this.careerPaths[index] = cp;
        }
        this.newCareerPath = { name: '', description: '', requiredSkills: '', targetRoles: '', averageSalary: 0 };
        this.editingCareerPathId = null;
        this.showSuccess('Career path updated successfully');
      },
      error: (err: any) => this.showError('Error updating career path: ' + err.message)
    });
  }

  cancelEditCareerPath(): void {
    this.newCareerPath = { name: '', description: '', requiredSkills: '', targetRoles: '', averageSalary: 0 };
    this.editingCareerPathId = null;
  }

  deleteCareerPath(id: number | undefined): void {
    if (!id) return;
    this.assessmentService.deleteCareerPath(id).subscribe({
      next: () => {
        this.careerPaths = this.careerPaths.filter(cp => cp.id !== id);
        this.showSuccess('Career path deleted');
      },
      error: (err: any) => this.showError('Error deleting career path: ' + err.message)
    });
  }

  // ============ ASSESSMENT QUESTIONS ============
  loadAssessmentQuestions(assessmentId: number): void {
    if (assessmentId === 0) return;
    this.selectedAssessmentId = assessmentId;
    this.assessmentService.getAssessmentQuestionsByAssessmentId(assessmentId).subscribe({
      next: (data: AssessmentQuestion[]) => {
        this.questions = data;
        this.showSuccess('Questions loaded');
      },
      error: (err: any) => this.showError('Error loading questions: ' + err.message)
    });
  }

  createAssessmentQuestion(): void {
    if (!this.newQuestion.assessmentId || !this.newQuestion.questionText || !this.newQuestion.category) {
      this.showError('Assessment ID, Question Text, and Category are required');
      return;
    }
    this.assessmentService.createAssessmentQuestion(this.newQuestion).subscribe({
      next: (question: AssessmentQuestion) => {
        this.questions.push(question);
        this.newQuestion = { assessmentId: this.selectedAssessmentId, questionText: '', category: '', difficulty: 1 };
        this.showSuccess('Question created successfully');
      },
      error: (err: any) => this.showError('Error creating question: ' + err.message)
    });
  }

  editAssessmentQuestion(question: AssessmentQuestion): void {
    this.editingQuestionId = question.id || null;
    this.newQuestion = { ...question };
  }

  updateAssessmentQuestion(): void {
    if (!this.editingQuestionId) return;
    if (!this.newQuestion.questionText || !this.newQuestion.category) {
      this.showError('Question Text and Category are required');
      return;
    }
    this.assessmentService.updateAssessmentQuestion(this.editingQuestionId, this.newQuestion).subscribe({
      next: (updated: AssessmentQuestion) => {
        const index = this.questions.findIndex(q => q.id === this.editingQuestionId);
        if (index > -1) {
          this.questions[index] = updated;
        }
        this.newQuestion = { assessmentId: this.selectedAssessmentId, questionText: '', category: '', difficulty: 1 };
        this.editingQuestionId = null;
        this.showSuccess('Question updated successfully');
      },
      error: (err: any) => this.showError('Error updating question: ' + err.message)
    });
  }

  cancelEditAssessmentQuestion(): void {
    this.newQuestion = { assessmentId: this.selectedAssessmentId, questionText: '', category: '', difficulty: 1 };
    this.editingQuestionId = null;
  }

  deleteAssessmentQuestion(id: number | undefined): void {
    if (!id) return;
    this.assessmentService.deleteAssessmentQuestion(id).subscribe({
      next: () => {
        this.questions = this.questions.filter(q => q.id !== id);
        this.showSuccess('Question deleted');
      },
      error: (err: any) => this.showError('Error deleting question: ' + err.message)
    });
  }

  // ============ ASSESSMENT ANSWERS ============
  loadAssessmentAnswers(questionId: number): void {
    if (questionId === 0) return;
    this.selectedQuestionId = questionId;
    this.assessmentService.getAssessmentAnswersByQuestionId(questionId).subscribe({
      next: (data: AssessmentAnswer[]) => {
        this.answers = data;
        this.showSuccess('Answers loaded');
      },
      error: (err: any) => this.showError('Error loading answers: ' + err.message)
    });
  }

  createAssessmentAnswer(): void {
    if (!this.newAnswer.assessmentQuestionId || !this.newAnswer.userId || !this.newAnswer.answerText) {
      this.showError('Question ID, User ID, and Answer Text are required');
      return;
    }
    this.assessmentService.createAssessmentAnswer(this.newAnswer).subscribe({
      next: (answer: AssessmentAnswer) => {
        this.answers.push(answer);
        this.newAnswer = { assessmentQuestionId: this.selectedQuestionId, userId: 0, answerText: '', score: 0 };
        this.showSuccess('Answer created successfully');
      },
      error: (err: any) => this.showError('Error creating answer: ' + err.message)
    });
  }

  editAssessmentAnswer(answer: AssessmentAnswer): void {
    this.editingAnswerId = answer.id || null;
    this.newAnswer = { ...answer };
  }

  updateAssessmentAnswer(): void {
    if (!this.editingAnswerId) return;
    if (!this.newAnswer.answerText) {
      this.showError('Answer Text is required');
      return;
    }
    this.assessmentService.updateAssessmentAnswer(this.editingAnswerId, this.newAnswer).subscribe({
      next: (updated: AssessmentAnswer) => {
        const index = this.answers.findIndex(a => a.id === this.editingAnswerId);
        if (index > -1) {
          this.answers[index] = updated;
        }
        this.newAnswer = { assessmentQuestionId: this.selectedQuestionId, userId: 0, answerText: '', score: 0 };
        this.editingAnswerId = null;
        this.showSuccess('Answer updated successfully');
      },
      error: (err: any) => this.showError('Error updating answer: ' + err.message)
    });
  }

  cancelEditAssessmentAnswer(): void {
    this.newAnswer = { assessmentQuestionId: this.selectedQuestionId, userId: 0, answerText: '', score: 0 };
    this.editingAnswerId = null;
  }

  deleteAssessmentAnswer(id: number | undefined): void {
    if (!id) return;
    this.assessmentService.deleteAssessmentAnswer(id).subscribe({
      next: () => {
        this.answers = this.answers.filter(a => a.id !== id);
        this.showSuccess('Answer deleted');
      },
      error: (err: any) => this.showError('Error deleting answer: ' + err.message)
    });
  }

  // ============ HELPERS ============
  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => this.errorMessage = '', 3000);
  }
}
