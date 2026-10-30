import { describe, it, expect } from 'vitest';
import { parseLocation } from '../src/router.js';

const at = (pathname, search = '') => parseLocation({ pathname, search });

describe('router', () => {
  it('sends the old admin login addresses to the login page', () => {
    expect(at('/admin/login').name).toBe('login');
    expect(at('/admin/login/').name).toBe('login');
    expect(at('/admin').name).toBe('login');
    expect(at('/admin/somewhere').name).toBe('not-found');
  });

  it('keeps the normal login page and its query', () => {
    expect(at('/login', '?next=%2Fdashboard')).toEqual({ name: 'login', params: {}, query: { next: '/dashboard' } });
  });
});
