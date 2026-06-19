import { describe, it, expect } from 'vitest';
import { buildCreatorUrl, buildPlatformSignupUrl } from '../../src/lib/affiliate';

describe('buildCreatorUrl', () => {
  it('passes through a valid https url and adds our utm source', () => {
    const out = buildCreatorUrl('https://onlyfans.com/footqueen');
    expect(out).toContain('https://onlyfans.com/footqueen');
    expect(out).toContain('utm_source=footmorningamerica');
  });

  it('rejects non-http(s) urls', () => {
    expect(() => buildCreatorUrl('javascript:alert(1)')).toThrow();
    expect(() => buildCreatorUrl('ftp://x.com')).toThrow();
  });
});

describe('buildPlatformSignupUrl', () => {
  it('appends the feetfinder affiliate ref', () => {
    const out = buildPlatformSignupUrl('feetfinder');
    expect(out).toContain('ref=');
    expect(out).toMatch(/^https:\/\//);
  });

  it('throws on an unknown platform', () => {
    // @ts-expect-error testing runtime guard
    expect(() => buildPlatformSignupUrl('myspace')).toThrow();
  });
});
