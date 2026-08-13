import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent],
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true
    }
  ]
})
export class PasswordInputComponent implements ControlValueAccessor {
  label = input<string>('Mật khẩu');
  placeholder = input<string>('••••••••');
  autocomplete = input<string>('current-password');
  showError = input<boolean>(false);
  errorMessage = input<string>('');
  errorClass = input<string>('border-rose-350');

  value = '';
  disabled = false;
  hidePassword = signal(true);

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(val => !val);
  }
}
