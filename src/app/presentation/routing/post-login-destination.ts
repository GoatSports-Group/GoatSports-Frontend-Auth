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
    const adminBase = `${destinations.adminUrl.replace(/\/+$/, '')}/admin/`;
    // Chỉ nhận đích nằm trong trang quản trị (vd chủ sân mở lời mời "nhận quản lý sân" -> /admin/applications?claim=…);
    // đích của trang người chơi hay domain lạ thì về dashboard như cũ, không thành open redirect.
    return requestedRedirect?.startsWith(adminBase) ? requestedRedirect : `${adminBase}dashboard`;
  }

  return requestedRedirect || destinations.clientUrl;
}
