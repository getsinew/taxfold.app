// The single switch for DESIGN.md § 5.6. Pages and the guide transform read launchView(); none of them
// tests the state itself, so flipping LAUNCH_STATE (and filling the ids below) is the whole launch change.
export const LAUNCH_STATE = 'pre-beta';
export const TESTFLIGHT_URL = '';
export const APP_STORE_ID = '';
export const APP_STORE_PT = '';

const GUIDES_HREF = '#guides';
const PRIVACY_HREF = '/privacy/#app';
const READ_GUIDES = { kind: 'button', label: 'Read the receipt guides', href: GUIDES_HREF };

const missing = (name) => {
  throw new Error(`launch-state: LAUNCH_STATE needs ${name} to be set before it can render`);
};

export function launchView(state = LAUNCH_STATE, ids = { TESTFLIGHT_URL, APP_STORE_ID, APP_STORE_PT }) {
  if (state === 'pre-beta') {
    return {
      state,
      primary: READ_GUIDES,
      secondary: { label: "What the app will and won't collect", href: PRIVACY_HREF },
      pill: 'In development · not on the App Store yet',
      helper: null,
      priceLine: 'One-time purchase when it ships. No subscription.',
      makerStatus: 'Taxfold is in development and is not on the App Store yet.',
      makerCta: null,
      itunesMeta: null,
    };
  }
  if (state === 'beta') {
    const href = ids.TESTFLIGHT_URL || missing('TESTFLIGHT_URL');
    return {
      state,
      primary: { kind: 'button', label: 'Join the TestFlight beta', href, external: true },
      secondary: { label: 'Read the receipt guides', href: GUIDES_HREF },
      pill: 'Public beta · free while in testing',
      helper: "Needs an iPhone with a current iOS and Apple's free TestFlight app.",
      priceLine: 'One-time purchase when it ships. No subscription.',
      makerStatus: 'Taxfold is in public beta and not on the App Store yet.',
      makerCta: { label: 'Join the TestFlight beta', href },
      itunesMeta: null,
    };
  }
  if (state === 'released') {
    const id = ids.APP_STORE_ID || missing('APP_STORE_ID');
    const pt = ids.APP_STORE_PT || missing('APP_STORE_PT');
    return {
      state,
      primary: { kind: 'badge', alt: 'Download Taxfold on the App Store', id, pt },
      secondary: READ_GUIDES,
      pill: null,
      helper: null,
      priceLine: '$39.99 once. No subscription.',
      makerStatus: 'Taxfold is on the App Store.',
      makerCta: { label: 'Get Taxfold on the App Store', href: appStoreUrl(id, pt, 'guide') },
      itunesMeta: (canonical) => `app-id=${id}, app-argument=${canonical}`,
    };
  }
  throw new Error(`launch-state: unknown LAUNCH_STATE ${JSON.stringify(state)}`);
}

export const appStoreUrl = (id, pt, page) =>
  `https://apps.apple.com/app/id${id}?pt=${encodeURIComponent(pt)}&ct=${encodeURIComponent(page)}&mt=8`;
