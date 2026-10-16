export { User } from '@domain/entities/user';

export type PublicKeyResponse = {
  publicKey: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegistrationAccountType = 'PLAYER' | 'VENUE_OWNER';

export type RegisterRequest = {
  accountType: RegistrationAccountType;
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type VerificationRequest = {
  email: string;
  verificationCode: string;
};

export type ForgotPasswordRequest = {
  email: string;
  password: string;
  confirmPassword: string;
};

/** Tài khoản bị khóa gửi thư cho quản trị viên; appealToken do lần đăng nhập đúng mật khẩu cấp (dùng một lần). */
export type AccountAppealRequest = {
  appealToken: string;
  subject: string;
  message: string;
};

/**
 * Đăng nhập đúng mật khẩu nhưng tài khoản chưa dùng được (HTTP 403, `error` là mã bên dưới).
 * ACCOUNT_INACTIVE: OTP kích hoạt đã gửi tới `email` (codeSent = false khi vừa gửi gần đây, chưa gửi lại).
 * ACCOUNT_BLOCKED: gửi khiếu nại bằng `appealToken` trong `appealTtlMinutes` phút.
 */
export type AccountStatusError =
  | { code: 'ACCOUNT_INACTIVE'; email: string; codeSent: boolean }
  | { code: 'ACCOUNT_BLOCKED'; email: string; fullName?: string; appealToken: string; appealTtlMinutes: number };

