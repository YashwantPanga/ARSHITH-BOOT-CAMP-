// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

const settings = {
  enabled: true, discountPct: 10, commissionPct: 10, releaseDays: 7, minWithdrawalPaise: 10000, attributionDays: 30, payoutSlaDays: 7, eligibleCourseIds: 'all', interviewEligible: true,
  promo: { enabled: true, desktopModal: true, mobileCard: true, headline: 'Your Network. Your Rewards.', description: 'Invite friends.', cta: 'Start Earning', mobileHeadline: 'Refer Friends & Earn 10%', mobileDescription: 'They get 10% OFF.', delaySeconds: 8, dismissDays: 7, locations: ['home'], guests: true, loggedIn: true }
};
const view = {
  code: 'RIYAT497', link: 'http://x/ref/RIYAT497', suspended: false,
  stats: { clicks: 9, registrations: 3, purchases: 3, conversion: 67, activeReferrals: 2 },
  wallet: { pending: 1791, available: 6282, reserved: 0, withdrawn: 0, lifetime: 8073 },
  rewards: [{ id: 'rw_1', course: 'Interview Prep', paidPaise: 53910, commissionPaise: 5391, status: 'available', createdAt: '2026-11-01T00:00:00Z', releaseAt: '2026-11-08T00:00:00Z' }],
  history: [{ name: 'A****', date: '2026-10-29T00:00:00Z', purchases: 2, amountPaise: 62820, commissionPaise: 6282, status: 'available' }],
  transactions: [{ id: 't1', type: 'commission.created', bucket: 'pending', delta: 5391, at: '2026-11-01T00:00:00Z' }],
  withdrawals: [], notifications: [{ id: 'n1', title: 'Commission earned', body: 'You earned ₹53.91', at: '2026-11-01T00:00:00Z', read: false }],
  savedPayout: { last: 'upi', upi: null, bank: null }, rules: { ...settings, enabled: true }, promoOptOut: false, leaderboard: [{ rank: 1, name: 'Riya T.', earnedPaise: 6282 }]
};

vi.mock('../src/services/api', () => ({
  api: {
    getMyReferrals: vi.fn(() => Promise.resolve(view)), getReferralPromo: vi.fn(() => Promise.resolve({ promo: settings.promo })),
    requestWithdrawal: vi.fn(), markReferralNotificationsRead: vi.fn(() => Promise.resolve({})), setPromoOptOut: vi.fn(() => Promise.resolve({ promoOptOut: true }))
  },
  getAdminToken: () => 'token'
}));
vi.mock('../src/services/adminApi', () => ({
  api: {
    getReferralOverview: vi.fn(() => Promise.resolve({ overview: { referrers: 1, clicks: 9, registrations: 3, purchases: 3, totalCommissionPaise: 8073, pendingCommissionPaise: 1791, availableCommissionPaise: 6282, withdrawnPaise: 0, pendingWithdrawals: 1, overdueWithdrawals: 0 }, settings })),
    getAdminReferrers: vi.fn(() => Promise.resolve({ referrers: [{ email: 'riya@example.test', name: 'Riya', code: 'RIYAT497', suspended: false, clicks: 9, registrations: 3, purchases: 3, wallet: view.wallet }] })),
    getAdminReferralRewards: vi.fn(() => Promise.resolve({ rewards: [{ id: 'rw_1', orderId: 'o1', referrerEmail: 'riya@example.test', refereeEmail: 'a@example.test', code: 'RIYAT497', courseTitle: 'Interview Prep', paidPaise: 53910, discountPaise: 5990, commissionPaise: 5391, refundedPaise: 0, status: 'available', createdAt: '2026-11-01T00:00:00Z', releasedAt: '2026-11-08T00:00:00Z' }] })),
    getAdminWithdrawals: vi.fn(() => Promise.resolve({ withdrawals: [{ id: 'wd_1', email: 'riya@example.test', name: 'Riya', amountPaise: 10000, method: 'upi', payout: { upiId: 'riya@okbank' }, status: 'pending_approval', createdAt: '2026-11-09T00:00:00Z' }] })),
    actOnWithdrawal: vi.fn(() => Promise.resolve({ success: true })),
    getReferralAudit: vi.fn(() => Promise.resolve({ audit: [] })), updateReferralSettings: vi.fn((s) => Promise.resolve({ settings: s }))
  }
}));
vi.mock('qrcode', () => ({ default: { toDataURL: () => Promise.resolve('data:image/png;base64,AAAA') } }));

import { api as adminApi } from '../src/services/adminApi';
import ReferralPage from '../src/pages/ReferralPage';
import AdminReferrals from '../src/components/staff/AdminReferrals';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Refer & Earn page', () => {
  it('shows how it works to visitors', async () => {
    render(<ReferralPage studentUser={null} navigate={() => {}} />);
    expect(screen.getByText('Three steps. Real money.')).toBeTruthy();
    expect(screen.getAllByText(/₹90/).length).toBeGreaterThan(0);
  });

  it('shows a learner their code, wallet, history and withdraw form', async () => {
    render(<ReferralPage studentUser={{ email: 'riya@example.test' }} navigate={() => {}} />);
    expect(await screen.findByText('RIYAT497')).toBeTruthy();
    expect(screen.getByText('₹80.73')).toBeTruthy();
    expect(screen.getByText('A****')).toBeTruthy();
    // below the minimum: the withdraw button stays disabled
    expect(screen.getByRole('button', { name: /Request withdrawal/ }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Notifications \(1\)/ }));
    expect(await screen.findByText('Commission earned')).toBeTruthy();
  });
});

describe('Admin Refer & Earn', () => {
  it('renders every tab and approves a withdrawal', async () => {
    render(<AdminReferrals notify={() => {}} />);
    expect(await screen.findByText('Link clicks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Referrers' }));
    expect(await screen.findByText('RIYAT497')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Commissions' }));
    expect(await screen.findByText('o1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Settings & promo' }));
    expect(screen.getByDisplayValue('Your Network. Your Rewards.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Audit log' }));
    expect(await screen.findByText('Nothing logged yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Withdrawals/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Approve/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(adminApi.actOnWithdrawal).toHaveBeenCalledWith('wd_1', 'approve', { reason: '' }));
  });
});
