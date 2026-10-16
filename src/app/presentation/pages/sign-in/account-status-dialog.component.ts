import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountStatusError } from '@application/dto/auth/auth.dto';
import { AuthService } from '@presentation/services/auth.service';
import { LucideIconComponent } from '@shared/components/ui/lucide-icon.component';

export const APPEAL_SUBJECT_MAX = 150;
export const APPEAL_MESSAGE_MIN = 10;
export const APPEAL_MESSAGE_MAX = 4000;

/**
 * Popup sau khi đăng nhập ĐÚNG mật khẩu nhưng tài khoản chưa dùng được:
 * - chưa kích hoạt: OTP đã gửi về email, nút "Xác thực" mở trang nhập mã;
 * - bị khóa: soạn thư gửi quản trị viên (như một email), phản hồi về email tài khoản.
 */
@Component({
  selector: 'app-account-status-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconComponent],
  templateUrl: './account-status-dialog.component.html'
})
export class AccountStatusDialogComponent implements OnInit {
  private authService = inject(AuthService);

  @Input({ required: true }) status!: AccountStatusError;
  @Output() closed = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();
  @ViewChild('firstField') firstField?: ElementRef<HTMLElement>;

  readonly subjectMax = APPEAL_SUBJECT_MAX;
  readonly messageMin = APPEAL_MESSAGE_MIN;
  readonly messageMax = APPEAL_MESSAGE_MAX;
  subject = 'Yêu cầu mở khóa tài khoản';
  message = '';
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    setTimeout(() => this.firstField?.nativeElement.focus());
  }

  get messageLength(): number {
    return this.message.trim().length;
  }

  get canSend(): boolean {
    const subject = this.subject.trim();
    return !this.sending() && subject.length > 0 && subject.length <= this.subjectMax
      && this.messageLength >= this.messageMin && this.messageLength <= this.messageMax;
  }

  @HostListener('document:keydown.escape')
  close(): void {
    if (!this.sending()) this.closed.emit();
  }

  goVerify(): void {
    this.verify.emit(this.status.email);
  }

  sendAppeal(): void {
    if (this.status.code !== 'ACCOUNT_BLOCKED' || !this.canSend) return;
    this.sending.set(true);
    this.error.set('');
    this.authService.submitAccountAppeal({
      appealToken: this.status.appealToken,
      subject: this.subject.trim(),
      message: this.message.trim()
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.error.set(err.error?.message || 'Chưa gửi được thư. Vui lòng thử lại.');
      }
    });
  }
}
