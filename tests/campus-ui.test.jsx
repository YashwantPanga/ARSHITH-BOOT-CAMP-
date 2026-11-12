// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const campaign = { id: 'cmp_1', collegeId: 'col_1', name: 'ABC launch', voucherCode: 'ABC-K8P92X', discountPct: 25, startsAt: '2026-11-01T00:00:00Z', endsAt: '2027-01-31T00:00:00Z', eligibleKinds: ['course'], eligibleCourseIds: 'all', minPurchasePaise: 0, maxDiscountPaise: 0, maxRedemptions: 0, perStudentLimit: 1, status: 'active', state: 'live', serial: '0001', createdAt: '2026-11-01T00:00:00Z', college: { id: 'col_1', name: 'ABC Engineering College', code: 'ABC001', logo: '' }, redeemed: 3, students: 3, discountPaise: 11175, inProgress: 0 };

vi.mock('../src/services/api', () => ({
  api: {
    getPaymentQuote: vi.fn(({ voucher } = {}) => Promise.resolve(voucher ? { originalPaise: 14900, discountPaise: 3725, finalPaise: 11175, voucher: { code: voucher, discountPct: 25, college: 'ABC Engineering College' }, referral: null } : { originalPaise: 14900, discountPaise: 0, finalPaise: 14900, referral: null })),
    createPaymentOrder: vi.fn(() => Promise.reject(Object.assign(new Error('off'), { data: { code: 'PAYMENTS_OFF' } }))),
    createInterviewOrder: vi.fn(), checkReferralCode: vi.fn(), claimReferral: vi.fn()
  },
  getAdminToken: () => 'token'
}));
vi.mock('../src/services/adminApi', () => ({
  api: {
    getCampusOverview: vi.fn(() => Promise.resolve({ analytics: { colleges: 1, activeColleges: 1, campaigns: 1, liveCampaigns: 1, redeemed: 3, students: 3, discountPaise: 11175, revenuePaise: 33525, byCollege: [{ id: 'col_1', name: 'ABC Engineering College', code: 'ABC001', status: 'active', campaigns: 1, live: 1, redeemed: 3, students: 3, discountPaise: 11175, revenuePaise: 33525 }] } })),
    getCampusCampaigns: vi.fn(() => Promise.resolve({ campaigns: [campaign] })),
    getCampusColleges: vi.fn(() => Promise.resolve({ colleges: [{ id: 'col_1', name: 'ABC Engineering College', code: 'ABC001', status: 'active', domains: [] }] })),
    getPublicCourses: vi.fn(() => Promise.resolve({ courses: [] })),
    updateCampusCampaign: vi.fn(() => Promise.resolve({})), newCampusCode: vi.fn(() => Promise.resolve({}))
  }
}));
vi.mock('../src/utils/cashfree', () => ({ payWithCashfree: vi.fn((make) => make()), preloadCashfree: vi.fn() }));

import { api } from '../src/services/api';
import { api as adminApi } from '../src/services/adminApi';
import AdminCampus from '../src/components/staff/AdminCampus';
import PaymentNotice from '../src/components/PaymentNotice';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Campus Rewards UI', () => {
  it('admin sees each college voucher card with its code, ready to share', async () => {
    render(<AdminCampus notify={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'College vouchers' }));
    // the wide voucher (laptops) and the tall coupon (phones)
    expect(await screen.findAllByRole('img', { name: /25% CodeLekho gift voucher for ABC Engineering College students, code ABC-K8P92X/ })).toHaveLength(2);
    expect(screen.getAllByText('ABC-K8P92X').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Share on WhatsApp/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download PNG/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Midnight/ }));
    expect(screen.getByRole('button', { name: /Copy share message/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Pause/ }));
    await waitFor(() => expect(adminApi.updateCampusCampaign).toHaveBeenCalledWith('cmp_1', { status: 'paused' }));
  });

  it('a learner enters the college voucher at checkout and it is sent with the order', async () => {
    render(<PaymentNotice course={{ id: 'python-programming', title: 'Python Programming' }} price={149} onClose={() => {}} />);
    fireEvent.click(await screen.findByText('Have a referral code or college voucher?'));
    fireEvent.change(screen.getByLabelText('Referral code or college voucher'), { target: { value: 'abc-k8p92x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('ABC-K8P92X applied')).toBeTruthy();
    expect(screen.getByText(/College voucher \(25%\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Pay .* and unlock/ }));
    await waitFor(() => expect(api.createPaymentOrder).toHaveBeenCalledWith('python-programming', 'ABC-K8P92X'));
  });
});
