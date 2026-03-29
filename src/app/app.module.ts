import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent // ✅ obligatoire
  ],
  imports: [
    BrowserModule,   // ✅ obligatoire pour app web
    HttpClientModule // ✅ pour API calls
  ],
  providers: [],
  bootstrap: [AppComponent] // ✅ obligatoire
})
export class AppModule {}