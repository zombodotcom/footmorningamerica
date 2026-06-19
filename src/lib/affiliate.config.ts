export type Platform = 'onlyfans' | 'feetfinder' | 'fansly' | 'other';

// Affiliate/referral codes — fill with real codes once accounts exist.
// Signup base URLs are the "start selling" pages where referral credit applies.
export const PLATFORM_SIGNUP: Record<Exclude<Platform, 'other'>, { base: string; refParam: string; ref: string }> = {
  onlyfans: { base: 'https://onlyfans.com/', refParam: 'ref', ref: 'PLACEHOLDER_OF_REF' },
  feetfinder: { base: 'https://feetfinder.com/', refParam: 'ref', ref: 'PLACEHOLDER_FF_REF' },
  fansly: { base: 'https://fansly.com/', refParam: 'ref', ref: 'PLACEHOLDER_FANSLY_REF' },
};

export const UTM_SOURCE = 'footmorningamerica';
