import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgIcon],
  template: `<ng-icon
    [name]="name()"
    [size]="size()"
    [color]="color()"
    [strokeWidth]="strokeWidth()"
  />`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        flex: none;
      }
    `,
  ],
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input('20');
  readonly color = input('currentColor');
  readonly strokeWidth = input<string | number>(1.8);
}
