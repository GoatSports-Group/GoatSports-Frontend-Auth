import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
  host: {
    '[class.auth-card--wide]': 'wide()'
  }
})
export class AuthCardComponent {
  loading = input(false);
  wide = input(false);
}
