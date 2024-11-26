import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // required animations providers
    provideToastr(), // Toastr providers
provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
