import { PLATFORM_SIGNUP, UTM_SOURCE, type Platform } from './affiliate.config';

export function buildCreatorUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }
  url.searchParams.set('utm_source', UTM_SOURCE);
  return url.toString();
}

export function buildPlatformSignupUrl(platform: Platform): string {
  if (platform === 'other' || !(platform in PLATFORM_SIGNUP)) {
    throw new Error(`No signup affiliate config for platform: ${platform}`);
  }
  const cfg = PLATFORM_SIGNUP[platform as Exclude<Platform, 'other'>];
  const url = new URL(cfg.base);
  url.searchParams.set(cfg.refParam, cfg.ref);
  return url.toString();
}
