import { Pipe, PipeTransform } from '@angular/core';
import katex from 'katex';

@Pipe({
  name: 'katex',
  standalone: true,
})
export class KatexPipe implements PipeTransform {
  transform(latex: string, displayMode: boolean = true): string {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  }
}
