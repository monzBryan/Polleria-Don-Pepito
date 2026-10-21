import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url },
    });
  }
  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
