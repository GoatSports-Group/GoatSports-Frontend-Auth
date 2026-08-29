import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { passwordStrengthScore } from '@shared/validators/password.validators';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  templateUrl: './password-strength.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordStrengthComponent {
  readonly password = input('');
  readonly errors = input<readonly string[]>([]);
  readonly errorId = input('');

  readonly segments = [1, 2, 3, 4] as const;
  readonly score = computed(() => passwordStrengthScore(this.password()));
}
