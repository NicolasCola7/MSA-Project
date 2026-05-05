import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';

export const authGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (sessionService.isLoggedIn()) {
    return true;
  }

  // Redirect to login (root path) if not authenticated
  return router.createUrlTree(['/']);
};
