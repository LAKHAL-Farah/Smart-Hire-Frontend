import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-situation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-situation.component.html',
  styleUrl: './step-situation.component.scss'
})
export class StepSituationComponent {
  @Input() selected: string | null = null;
  @Input() customValue: string = '';
  @Output() selectionChange = new EventEmitter<string>();
  @Output() customValueChange = new EventEmitter<string>();

  situations = [
    { id: 'student', emoji: '🎓', title: 'Engineering Student', desc: 'Currently studying CS, software engineering, or a related field.' },
    { id: 'junior', emoji: '💻', title: 'Junior Engineer', desc: 'Less than 2 years of professional development experience.' },
    { id: 'switcher', emoji: '🔄', title: 'Career Switcher', desc: 'Transitioning from another field into software engineering.' },
    { id: 'experienced', emoji: '🚀', title: 'Experienced Engineer', desc: '2+ years of experience, looking to level up or switch roles.' },
    { id: 'other', emoji: '✏️', title: 'Other', desc: 'Describe your current situation in your own words.' },
  ];

  select(id: string): void {
    this.selectionChange.emit(id);
  }

  onCustomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customValueChange.emit(value);
  }
}
