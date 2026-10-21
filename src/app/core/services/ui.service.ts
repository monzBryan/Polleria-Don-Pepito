import { computed, effect, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly cartOpen = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly integrationNoticeDismissed = signal(
    localStorage.getItem('dp_integration_notice_dismissed') === '1',
  );

  readonly anyOverlayOpen = computed(
    () => this.cartOpen() || this.mobileMenuOpen(),
  );

  constructor() {
    effect(() => {
      document.body.classList.toggle('body-lock', this.anyOverlayOpen());
    });
  }

  openCart(): void {
    this.cartOpen.set(true);
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
  }

  closeCart(): void {
    this.cartOpen.set(false);
  }

  toggleCart(): void {
    if (this.cartOpen()) {
      this.closeCart();
    } else {
      this.openCart();
    }
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
    this.cartOpen.set(false);
    this.searchOpen.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    this.mobileMenuOpen.set(false);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  closeAll(): void {
    this.cartOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
  }

  dismissIntegrationNotice(): void {
    this.integrationNoticeDismissed.set(true);
    try {
      localStorage.setItem('dp_integration_notice_dismissed', '1');
    } catch {
      // Sin acción.
    }
  }
}
