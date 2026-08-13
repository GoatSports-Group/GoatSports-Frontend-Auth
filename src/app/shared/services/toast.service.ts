import { Injectable, inject } from '@angular/core';
import { NotifyService, NotifyType } from '@shared/components/notify/notify.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly notify = inject(NotifyService);

  show(message: string, type: Exclude<NotifyType, 'warning'> = 'info', _duration = 3000): void {
    this.notify[type](message);
  }
}
