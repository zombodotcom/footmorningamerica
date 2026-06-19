import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../../src/lib/listing';

const valid = {
  display_name: 'Foot Queen',
  platform: 'onlyfans',
  handle: 'footqueen',
  outbound_url: 'https://onlyfans.com/footqueen',
  bio: 'Hi',
};

describe('validateSubmission', () => {
  it('accepts a valid submission', () => {
    const r = validateSubmission(valid);
    expect(r.ok).toBe(true);
  });

  it('rejects a missing display_name', () => {
    const r = validateSubmission({ ...valid, display_name: '' });
    expect(r.ok).toBe(false);
  });

  it('rejects an unknown platform', () => {
    const r = validateSubmission({ ...valid, platform: 'myspace' });
    expect(r.ok).toBe(false);
  });

  it('rejects a non-https outbound_url', () => {
    const r = validateSubmission({ ...valid, outbound_url: 'http://x.com' });
    expect(r.ok).toBe(false);
  });
});
