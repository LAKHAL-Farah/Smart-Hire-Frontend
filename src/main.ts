import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Some CommonJS browser libs expect Node-style globals.
const g = globalThis as any;
if (typeof g.global === 'undefined') {
  g.global = g;
}
if (typeof g.process === 'undefined') {
  g.process = { env: {} };
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
