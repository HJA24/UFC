import { Component, Input } from '@angular/core';
import { TransitionMatrixTableComponent } from "src/app/components/tables/transition-matrix/transition-matrix-table.component";
import { KatexPipe } from "src/app/pipes/katex.pipe";

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    TransitionMatrixTableComponent,
    KatexPipe,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  @Input() p_strike_blue: number = 0.1;

  // Q: transient to transient (5x5)
  Q: (number | string)[][] = [
    [0.6, 0.7, 1 - this.p_strike_blue, 0.6, 0.8],
    [0.3, 0,   0,   0,   0],
    [0,   0.3, 0,   0,   0],
    [0.1, 0,   0,   0,   0],
    [0,   0,   0,   0.4, 0],
  ];

  // R: absorbing from transient (2x5)
  R: (number | string)[][] = [
    [0, 0, this.p_strike_blue, 0, 0],
    [0, 0, 0, 0, 0.2],
  ];

  labels: string[] = [
    'standing',
    'strike attempted blue',
    'strike attempted red',
    'strike landed blue',
    'strike landed red',
    'knockout landed blue',
    'knockout landed red',
  ];

  highlightRegion: 'Q' | 'R' | 'O' | 'I' | null = null;

  setHighlight(region: 'Q' | 'R' | 'O' | 'I'): void {
    this.highlightRegion = region;
  }

  clearHighlight(): void {
    this.highlightRegion = null;
  }
}
