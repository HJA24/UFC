import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hdi-bar',
  standalone: true,
  templateUrl: './hdi-bar.component.html',
  styleUrl: './hdi-bar.component.css',
})

export class HdiBarComponent {
  /** Lower bound of the HDI */
  min = input.required<number>();

  /** Upper bound of the HDI */
  max = input.required<number>();

  /** Color of the bar */
  color = input.required<string>();

  /** Label for the interval */
  label = input.required<string>();

  /** Z-index for layering */
  zIndex = input<number>(0);
}
