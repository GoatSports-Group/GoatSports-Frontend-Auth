import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const trimmedLengthValidator = (minimum: number, maximum: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value !== 'string' || control.value.length === 0) {
      return null;
    }

    const length = control.value.trim().length;
    if (length < minimum) {
      return { trimmedMinLength: { requiredLength: minimum, actualLength: length } };
    }

    if (length > maximum) {
      return { trimmedMaxLength: { requiredLength: maximum, actualLength: length } };
    }

    return null;
  };
};
