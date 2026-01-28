import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortedKeys'
})
export class SortedKeysPipe implements PipeTransform {
  transform<T>(value: Record<number, T[]>): Array<{ key: number, value: T[] }> {
    if (!value) return [];

    return Object.keys(value)
      .map(k => Number(k))
      .sort((a, b) => a - b)
      .map(key => ({ key, value: value[key] }));
  }
}
