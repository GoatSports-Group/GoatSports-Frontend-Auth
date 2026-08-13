import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss']
})
export class AuthCardComponent {
  loading = input(false);
}
