import { bootstrapApplication } from '@angular/platform-browser';
//import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
