import { FormBuilder, Validators } from '@angular/forms';
import { PASSWORD_PATTERN } from '@shared/constants/auth.constants';
import { passwordMatchValidator } from '@shared/validators/password.validators';
import { trimmedLengthValidator } from '@shared/validators/registration.validators';

export interface RegistrationFormValue {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function registrationForm(
  fb: FormBuilder,
  duplicate: { duplicateUsername: () => boolean; duplicateEmail: () => boolean }
) {
  return fb.nonNullable.group({
    username: ['', [
      Validators.required,
      trimmedLengthValidator(3, 50),
      Validators.pattern(/^\S+$/),
      () => duplicate.duplicateUsername() ? { duplicate: true } : null
    ]],
    fullName: ['', [Validators.required, trimmedLengthValidator(2, 100)]],
    email: ['', [
      Validators.required,
      trimmedLengthValidator(1, 254),
      Validators.email,
      () => duplicate.duplicateEmail() ? { duplicate: true } : null
    ]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });
}
