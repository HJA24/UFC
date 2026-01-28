import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summation.component.html',
  styleUrl: './summation.component.css'
})
export class SummationComponent {
  @Input() lowerLimit: string = '';
  @Input() upperLimit: string = '';
}
