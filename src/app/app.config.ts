import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
<<<<<<< HEAD
import { authInterceptor } from './features/front-office/auth/interceptors/auth.interceptor';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
=======
import { authInterceptor } from './core/interceptors/auth.interceptor';
>>>>>>> 07d1b6a95d3c6ddc7abeaefab264b2268972d9f1

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideMonacoEditor({
      baseUrl: '/vs',
      defaultOptions: {
        automaticLayout: true,
      },
    }),
  ]
};
