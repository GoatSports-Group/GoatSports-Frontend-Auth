import { Component } from '@angular/core';
import { environment } from "@environments/environment"

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false
})
export class AuthComponent {
  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }
}
