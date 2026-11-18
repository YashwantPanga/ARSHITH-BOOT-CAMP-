// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../src/services/api', () => ({ api: { learnerLogin: vi.fn(), learnerRegister: vi.fn(), checkReferralCode: vi.fn() }, setAdminToken: vi.fn(), getAdminToken: () => null }));

import AuthPage from '../src/components/LoginModal';

afterEach(cleanup);

describe('login card on phones', () => {
  it('the show-password eye and taps around the field never open Forgot password', () => {
    const onForgotPassword = vi.fn();
    const { container } = render(<AuthPage mode="login" onSwitchMode={() => {}} onBack={() => {}} onSuccess={() => {}} onNeedVerification={() => {}} onForgotPassword={onForgotPassword} />);
    const pw = container.querySelector('#auth-password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(pw.type).toBe('text');
    // a tap on the field's wrapper or its label (what a slightly-off tap hits) must not reach the Forgot button
    fireEvent.click(pw.closest('span').parentElement);
    fireEvent.click(screen.getByText('Password'));
    expect(onForgotPassword).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });
});
