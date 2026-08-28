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
