export type User = {
  userId: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  role: {
    roleId: string;
    name: string;
  };
  keycloakId?: string;
  authProvider?: string;
  /** Chỉ có ở phản hồi đăng nhập: lần đăng nhập này vừa hủy yêu cầu xóa tài khoản đang chờ. */
  accountRestored?: boolean;
}
