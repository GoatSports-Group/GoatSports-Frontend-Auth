/** Mọi vai trò không phải người chơi làm việc ở trang quản trị: ADMIN, chủ sân và vai trò admin tự tạo. */
const CLIENT_ROLE = 'PLAYER';

export interface PostLoginDestinations {
  adminUrl: string;
  clientUrl: string;
}

export function resolvePostLoginDestination(
  roleName: string | null | undefined,
  requestedRedirect: string | null | undefined,
  destinations: PostLoginDestinations
): string {
  const role = (roleName || '').toUpperCase();
  if (role && role !== CLIENT_ROLE) {
    return `${destinations.adminUrl.replace(/\/+$/, '')}/admin/dashboard`;
  }

  return requestedRedirect || destinations.clientUrl;
}
