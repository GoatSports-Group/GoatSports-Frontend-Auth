import { Component } from '@angular/core';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    standalone: false
})
export class AuthComponent {
  navigateToHome() {
    window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
  }
}
