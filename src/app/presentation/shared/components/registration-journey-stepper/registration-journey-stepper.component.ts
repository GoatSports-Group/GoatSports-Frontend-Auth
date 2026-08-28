import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type RegistrationJourneyStep = 1 | 2 | 3 | 4;

type JourneyStep = {
  number: RegistrationJourneyStep;
  title: string;
};

@Component({
  selector: 'app-registration-journey-stepper',
  standalone: true,
  templateUrl: './registration-journey-stepper.component.html',
  styleUrl: './registration-journey-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationJourneyStepperComponent {
  readonly currentStep = input.required<RegistrationJourneyStep>();
  readonly maxNavigableStep = input<RegistrationJourneyStep | 0>(0);
  readonly stepChange = output<RegistrationJourneyStep>();

  readonly steps: readonly JourneyStep[] = [
    { number: 1, title: 'Tài khoản' },
    { number: 2, title: 'Xác thực' },
    { number: 3, title: 'Thông tin cơ sở' },
    { number: 4, title: 'Hồ sơ chủ sân' }
  ];

  readonly progress = computed(() => ((this.currentStep() - 1) / (this.steps.length - 1)) * 100);

  selectStep(step: RegistrationJourneyStep): void {
    if (this.maxNavigableStep() > 0 && step <= this.maxNavigableStep()) {
      this.stepChange.emit(step);
    }
  }
}
