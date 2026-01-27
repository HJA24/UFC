import { Component, computed, ElementRef, Input, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AnimationEvent } from '@angular/animations';
import { MatrixTableComponent } from '../../tables/matrix/matrix-table.component';
import { SummationComponent } from '../../latex/summation/summation.component';

@Component({
  selector: 'app-theory-fundamental-matrix-accordion',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatrixTableComponent, SummationComponent],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'visible', opacity: 1 }))
    ]),
    trigger('rotateIcon', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' }))
    ])
  ],
  templateUrl: './theory-fundamental-matrix-accordion.component.html',
  styleUrl: './theory-fundamental-matrix-accordion.component.css'
})
export class TheoryFundamentalMatrixAccordionComponent {
  @Input() startOpen: boolean = false;
  @ViewChild('accordionHeader') accordionHeader!: ElementRef<HTMLDivElement>;
  @ViewChild('accordionContent') accordionContent!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  title = computed(() => this.isOpen()
    ? 'hide the derivation of the fundamental matrix'
    : 'show the derivation of the fundamental matrix'
  );

  // Symbolic 2x2 block matrices
  // T = [[Q, O], [R, I]]
  T_matrix: string[][] = [
    ['Q', 'O'],
    ['R', 'I']
  ];

  // T² = [[Q², O], [RQ + R, I]]
  T2_matrix: string[][] = [
    ['Q<sup>2</sup>', 'O'],
    ['RQ + R', 'I']
  ];

  // T³ = [[Q³, O], [RQ² + RQ + R, I]]
  T3_matrix: string[][] = [
    ['Q<sup>3</sup>', 'O'],
    ['RQ<sup>2</sup> + RQ + R', 'I']
  ];

  // T^k = [[Q^k, O], [R + RQ + ... + RQ^(k-1), I]]
  Tk_matrix: string[][] = [
    ['Q<sup><i>k</i></sup>', 'O'],
    ['R + RQ + ... + RQ<sup><i>k</i>-1</sup>', 'I']
  ];


  toggle(): void {
    this.isOpen.update(v => !v);
  }

  onExpandDone(event: AnimationEvent): void {
    if (event.toState === 'expanded' && this.accordionHeader) {
      const element = this.accordionHeader.nativeElement;
      const offset = 10;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}
