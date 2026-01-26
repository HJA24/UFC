import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-skill-slider',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule],
  templateUrl: './skill-slider.component.html',
  styleUrl: './skill-slider.component.css'
})
export class SkillSliderComponent {
  @Input() label: string = '';
  @Input() color: 'blue' | 'red' = 'blue';
  @Input() min: number = 0;
  @Input() max: number = 10;
  @Input() step: number = 0.1;
  @Input() value: number = 5;
  @Output() valueChange = new EventEmitter<number>();

  onValueChange(newValue: number): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}
