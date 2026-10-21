import { Pipe, PipeTransform } from '@angular/core';
import { soles } from '../../core/utils/format';

@Pipe({
  name: 'soles',
  standalone: true,
})
export class SolesPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return soles(value);
  }
}
