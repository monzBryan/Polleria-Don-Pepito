import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private applied = false;

  readonly fallback = input('/img/fallback-food.svg', { alias: 'appImageFallback' });

  @HostListener('error')
  onError(): void {
    if (this.applied) return;
    this.applied = true;
    this.element.nativeElement.src = this.fallback();
    this.element.nativeElement.classList.add('is-fallback');
  }
}
