import { Component, input } from '@angular/core';

@Component({
  selector: 'app-submit-button',
  standalone: true,
  templateUrl: './submit-button.component.html',
  styleUrls: ['./submit-button.component.scss']
})
export class SubmitButtonComponent {
  label = input.required<string>();
  loadingLabel = input('Đang xử lý...');
  loading = input(false);
  disabled = input(false);
}
