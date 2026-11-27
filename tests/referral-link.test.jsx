// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('../src/services/api', () => ({
  api: {
    learnerLogin: vi.fn(), learnerRegister: vi.fn(), checkReferralCode: vi.fn(), claimReferral: vi.fn(),
    trackReferralClick: vi.fn(async (code) => ({ valid: true, code, referrerName: 'Asha', discountPct: 10 }))
  },
  setAdminToken: vi.fn(),
  getAdminToken: () => null
}));

import AuthPage from '../src/components/LoginModal';
import { RefLanding } from '../src/pages/ReferralPage';

afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState(null, '', '/'); });

const register = () => render(<AuthPage mode="signup" onSwitchMode={() => {}} onBack={() => {}} onSuccess={() => {}} onNeedVerification={() => {}} onForgotPassword={() => {}} />);

describe('referral links', () => {
  it('a visitor who opens /ref/CODE is sent straight to the Register page', async () => {
    const navigate = vi.fn();
    render(<RefLanding code="ASHA10" studentUser={null} navigate={navigate} toast={() => {}} />);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/register', { replace: true }));
  });

  it('the Register page fills in the code from the invite link', () => {
    localStorage.setItem('cl_ref', JSON.stringify({ code: 'ASHA10', referrerName: 'Asha', at: Date.now() }));
    const { container } = register();
    expect(container.querySelector('#ref-code').value).toBe('ASHA10');
    expect(screen.queryByText(/invited/i)).toBeNull(); // only the code is filled in, no name banner
  });

  it('also accepts /register?ref=CODE', () => {
    window.history.replaceState(null, '', '/register?ref=ravi22');
    const { container } = register();
    expect(container.querySelector('#ref-code').value).toBe('RAVI22');
  });
});
