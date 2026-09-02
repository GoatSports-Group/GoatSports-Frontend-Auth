import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from "@environments/environment";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [RouterModule]
})
export class AuthComponent {
  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }
}
