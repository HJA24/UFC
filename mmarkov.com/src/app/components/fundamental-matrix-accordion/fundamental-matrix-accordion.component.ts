import { Component, computed, ElementRef, Input, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AnimationEvent } from '@angular/animations';

@Component({
  selector: 'app-fundamental-matrix-accordion',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'visible', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ]),
    trigger('rotateIcon', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ],
  templateUrl: './fundamental-matrix-accordion.component.html',
  styles: [`
    .accordion {
      width: 100%;
      margin: 16px 0;
    }

    .accordion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(200, 200, 200, 0.2);
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .accordion-header:hover {
      background: rgba(200, 200, 200, 0.3);
    }

    .accordion-title {
      font-weight: 500;
    }

    .accordion-content {
      padding: 0 16px;
    }
  `]
})
export class FundamentalMatrixAccordionComponent {
  @Input() topic: string = '';
  @Input() startOpen: boolean = false;
  @ViewChild('accordionContent') accordionContent!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  title = computed(() => (this.isOpen() ? 'Hide ' : 'Show ') + this.topic);

  latexContent = `
    <p>
      $$
      \\begin{align*}
      T &=
      \\begin{bmatrix}
      Q & O \\\\
      R & I
      \\end{bmatrix} \\\\[1.5ex]
      T^2 &=
      \\begin{bmatrix}
      Q & O \\\\
      R & I
      \\end{bmatrix}
      \\begin{bmatrix}
      Q & O \\\\
      R & I
      \\end{bmatrix}
      =
      \\begin{bmatrix}
      Q^2 & O \\\\
      RQ + R & I
      \\end{bmatrix} \\\\[1.5ex]
      T^3 &=
      \\begin{bmatrix}
      Q & O \\\\
      R & I
      \\end{bmatrix}
      \\begin{bmatrix}
      Q^2 & O \\\\
      RQ + R & I
      \\end{bmatrix}
      =
      \\begin{bmatrix}
      Q^3 & O \\\\
      RQ^2 + RQ + R & I
      \\end{bmatrix}
      \\end{align*}
      $$
    </p>
    <p>
      In general, the pattern can be written as
      $$
      \\begin{align*}
      T^k &=
      \\begin{bmatrix}
      Q^k & O \\\\
      R + RQ + ... + RQ^{k-1} & I
      \\end{bmatrix}
      =
      \\begin{bmatrix}
      Q^k & O \\\\
      R\\sum^{k-1}_{i=0}Q^i & I
      \\end{bmatrix}
      \\end{align*}
      $$
    </p>
    <p>
      By calculating the lower left element of the matrix, we encounter the series
      $$
      \\sum_{i=0}^\\infty Q^i = I + Q + Q^2 + Q^3 + ...
      $$
      This series converges to \\((I-Q)^{-1}\\) when some power \\(Q^k\\) has column sums that are less than 1.
    </p>
  `;

  ngOnInit(): void {
    this.isOpen.set(this.startOpen);
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  onExpandDone(event: AnimationEvent): void {
    if (event.toState === 'expanded' && this.accordionContent) {
      this.accordionContent.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
