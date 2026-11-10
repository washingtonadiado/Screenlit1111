/**
 * Screenlit Phase 3 Unit Tests
 * Validates localization dictionaries, RTL settings, clinical disclaimers,
 * comprehension check structure, and consent management
 */

import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_OPTIONS,
  LOCALES,
  getDictionary,
  getReviewNotice,
  isRtl,
} from '../src/locales';

describe('Phase 3: Localization and Multi Language Integrity', () => {
  it('provides complete translation dictionaries for English, Arabic, and Swahili', () => {
    expect(LOCALES.en).toBeDefined();
    expect(LOCALES.ar).toBeDefined();
    expect(LOCALES.sw).toBeDefined();

    const requiredSections = [
      'app',
      'nav',
      'home',
      'result',
      'ack',
      'reading',
      'wearable',
      'consent',
      'appointments',
      'carePlan',
      'common',
    ];

    ['en', 'ar', 'sw'].forEach((lang) => {
      const dict = getDictionary(lang as any);
      requiredSections.forEach((sec) => {
        expect((dict as any)[sec]).toBeDefined();
      });
    });
  });

  it('correctly flags Arabic for Right to Left layout support', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('sw')).toBe(false);

    const arOpt = LANGUAGE_OPTIONS.find((l) => l.code === 'ar');
    expect(arOpt?.dir).toBe('rtl');
  });

  it('marks Arabic and Swahili translations as requiring native clinical review', () => {
    const arNotice = getReviewNotice('ar');
    expect(arNotice).toContain('Arabic translation requires native clinical review');

    const swNotice = getReviewNotice('sw');
    expect(swNotice).toContain('Swahili translation requires native clinical review');

    const enNotice = getReviewNotice('en');
    expect(enNotice).toBeUndefined();
  });

  it('includes mandatory clinical guideline disclaimers across all locales', () => {
    ['en', 'ar', 'sw'].forEach((lang) => {
      const dict = getDictionary(lang as any);
      expect(dict.result.guidelineDisclaimer).toBeDefined();
      expect(dict.result.guidelineDisclaimer.length).toBeGreaterThan(10);
    });
  });

  it('includes explicit non diagnostic wearable disclaimers across all locales', () => {
    ['en', 'ar', 'sw'].forEach((lang) => {
      const dict = getDictionary(lang as any);
      expect(dict.wearable.disclaimer).toBeDefined();
      expect(dict.wearable.disclaimer.length).toBeGreaterThan(15);
    });
  });
});

describe('Phase 3: Patient Understanding Check and Consent Logic', () => {
  it('structures the one question understanding check with three distinct options', () => {
    const en = getDictionary('en');
    expect(en.ack.question).toBeDefined();
    expect(en.ack.opt1).toBeDefined();
    expect(en.ack.opt2).toBeDefined();
    expect(en.ack.opt3).toBeDefined();

    expect(en.ack.opt2).toContain('Confirm with a repeat reading');
  });

  it('defines consent permit and deny action labels for granular sharing', () => {
    const en = getDictionary('en');
    expect(en.consent.togglePermit).toBe('Sharing Allowed');
    expect(en.consent.toggleDeny).toBe('Sharing Denied');
    expect(en.consent.revokeCaregiver).toBeDefined();
  });
});
