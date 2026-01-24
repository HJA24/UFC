import { Directive, ElementRef, Input, OnChanges, AfterViewInit } from '@angular/core';

declare global {
  interface Window {
    MathJax: any;
  }
}

@Directive({
  selector: '[appMathjax]',
  standalone: true,
})
export class MathjaxDirective implements OnChanges, AfterViewInit {
  @Input() appMathjax: string = '';

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.renderMath();
  }

  ngOnChanges(): void {
    this.renderMath();
  }

  private renderMath(): void {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([this.el.nativeElement]);
    }
  }
}
