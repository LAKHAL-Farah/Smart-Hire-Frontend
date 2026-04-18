import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CareerCardComponent } from '../career-card/career-card.component';
import { Career } from '../roadmap.component';

@Component({
  selector: 'app-career-grid',
  standalone: true,
  imports: [CommonModule, CareerCardComponent],
  templateUrl: './career-grid.component.html',
  styleUrl: './career-grid.component.scss'
})
export class CareerGridComponent {
  @Input({ required: true })
  careers: Career[] = [];

  @Output() careerSelected = new EventEmitter<Career>();

  onSelect(career: Career): void {
    this.careerSelected.emit(career);
  }
}
