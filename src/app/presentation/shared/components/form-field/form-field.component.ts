import { Component, input } from '@angular/core';
import { LucideIconComponent } from '@shared/components/ui/lucide-icon.component';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [LucideIconComponent],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss']
})
export class FormFieldComponent {
  label = input.required<string>();
  fieldId = input<string>('');
  errorId = input<string>('');
  icon = input<string>('');
  errorMessage = input<string>('');
  showError = input(false);
  hasError = input(false);
}
