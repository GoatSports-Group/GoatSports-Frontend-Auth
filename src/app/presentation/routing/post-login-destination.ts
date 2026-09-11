const DASHBOARD_ROLES = new Set(['ADMIN', 'VENUE_OWNER']);

export interface PostLoginDestinations {
  adminUrl: string;
  clientUrl: string;
}

export function resolvePostLoginDestination(
  roleName: string | null | undefined,
  requestedRedirect: string | null | undefined,
  destinations: PostLoginDestinations
): string {
  if (DASHBOARD_ROLES.has((roleName || '').toUpperCase())) {
    return `${destinations.adminUrl.replace(/\/+$/, '')}/admin/dashboard`;
  }

  return requestedRedirect || destinations.clientUrl;
}
