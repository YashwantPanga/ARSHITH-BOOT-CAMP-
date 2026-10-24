import { describe, it, expect } from 'vitest';
import { matchNameInText } from '../src/utils/idCardOcr';

const CARD = `GOVERNMENT OF INDIA
Panga Yashwant
DOB: 14/02/2002   Male
1234 5678 9012`;

describe('ID card name matching', () => {
  it('matches the registered name in any order and case', () => {
    expect(matchNameInText('Yashwant Panga', CARD).matched).toBe(true);
    expect(matchNameInText('PANGA YASHWANT', CARD).matched).toBe(true);
  });

  it('tolerates small OCR slips', () => {
    expect(matchNameInText('Yashwant Panga', 'NAME: YASHVVANT PANGA').matched).toBe(true);
    expect(matchNameInText('Yashwant Panga', 'NAME: Yash want Panga').matched).toBe(true);
  });

  it('accepts one part printed only as an initial', () => {
    expect(matchNameInText('Yashwant Panga', 'P. YASHWANT  ROLL 22B01').matched).toBe(true);
  });

  it('rejects a different name', () => {
    const r = matchNameInText('Vullas Reddy', CARD);
    expect(r.matched).toBe(false);
    expect(r.percent).toBe(0);
  });

  it('rejects when only part of the name is on the card', () => {
    const r = matchNameInText('Yashwant Kumar Panga', CARD);
    expect(r.matched).toBe(false);
    expect(r.missing).toEqual(['KUMAR']);
  });

  it('ignores letter case on either side', () => {
    expect(matchNameInText('yashwant panga', 'Name: PANGA YASHWANT').matched).toBe(true);
    expect(matchNameInText('YASHWANT PANGA', 'name: yashwant panga').matched).toBe(true);
    expect(matchNameInText('YaShWaNt PaNgA', 'Yashwant Panga').matched).toBe(true);
  });

  it('reads digits OCR put inside a name as letters', () => {
    expect(matchNameInText('Yashwant Panga', 'Y4SHWANT PANG4  DOB 14/02/2002').matched).toBe(true);
    expect(matchNameInText('Vullas Reddy', 'VULLA5 REDDY').matched).toBe(true);
  });

  it('finds a name OCR split into three pieces', () => {
    expect(matchNameInText('Yashwant Panga', 'YA SH WANT PANGA').matched).toBe(true);
  });

  it('does not let short words match loosely', () => {
    expect(matchNameInText('Ram Das', 'RAM DAS').matched).toBe(true);
    expect(matchNameInText('Ram Das', 'RAJ DAN').matched).toBe(false);
  });
});
