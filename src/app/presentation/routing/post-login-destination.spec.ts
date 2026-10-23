import { describe, expect, it } from 'vitest';
import { resolvePostLoginDestination } from './post-login-destination';

const destinations = {
  adminUrl: 'http://localhost:4300',
  clientUrl: 'http://localhost:4200'
};

describe('resolvePostLoginDestination', () => {
  it.each(['ADMIN', 'VENUE_OWNER', 'venue_owner', 'SUPPORT_STAFF'])(
    'always sends %s to the dashboard and ignores a client redirect',
    role => {
      expect(resolvePostLoginDestination(role, 'http://localhost:4200/venues', destinations))
        .toBe('http://localhost:4300/admin/dashboard');
    }
  );

  it('keeps an admin-app destination for staff, e.g. an owner claiming an invited venue', () => {
    const claim = 'http://localhost:4300/admin/applications?claim=v1';
    expect(resolvePostLoginDestination('VENUE_OWNER', claim, destinations)).toBe(claim);
    expect(resolvePostLoginDestination('VENUE_OWNER', 'http://localhost:4300.evil.test/admin/x', destinations))
      .toBe('http://localhost:4300/admin/dashboard');
  });

  it('keeps the requested client route for a player', () => {
    expect(resolvePostLoginDestination('PLAYER', 'http://localhost:4200/venues', destinations))
      .toBe('http://localhost:4200/venues');
  });

  it('sends a player to the client home when no redirect was requested', () => {
    expect(resolvePostLoginDestination('PLAYER', undefined, destinations))
      .toBe('http://localhost:4200');
  });
});
