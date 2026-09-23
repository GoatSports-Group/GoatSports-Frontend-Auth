import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { hideBootSplashWhenReady } from './boot-splash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false
})
export class AppComponent {
  title = 'Goat Sports';

  constructor(router: Router) {
    hideBootSplashWhenReady(router);
  }
}
