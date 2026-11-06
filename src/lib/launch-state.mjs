// The single switch for DESIGN.md § 5.6. Pages and the guide transform read launchView(); none of them
// tests the state itself, so flipping LAUNCH_STATE (and filling the ids below) is the whole launch change.
export const LAUNCH_STATE = 'pre-beta';
export const TESTFLIGHT_URL = '';
export const APP_STORE_ID = '';
// Apple issues the provider token (pt) only once App Store Connect shows the Campaigns tab, at least 24 hours after
// release. On launch day `released` therefore runs with an id and no token, and plain store links.
export const APP_STORE_PT = '';

// The campaign token (ct) for the landing page's badge. Guides use ctFromCluster(): one token per cluster, because
// per-slug tokens never clear Apple's 5-user reporting floor.
export const SITE_CT = 'site';

// Test seam, open only under Vitest (which sets VITEST, and so do the builds it spawns): a build can render another
// state without editing the constants above. Outside Vitest nothing here reads the environment, because Astro loads
// .env files into process.env mid-build, after astro.config.mjs has already built the maker note, and a stray
// TAXFOLD_* there would split one site across two states. A variable that is set, even to '', replaces its constant.
const fromEnv = (name, committed) => (process.env.VITEST && name in process.env ? process.env[name] : committed);
export const effectiveLaunch = () => ({
  state: fromEnv('TAXFOLD_LAUNCH_STATE', LAUNCH_STATE),
  ids: {
    TESTFLIGHT_URL: fromEnv('TAXFOLD_TESTFLIGHT_URL', TESTFLIGHT_URL),
    APP_STORE_ID: fromEnv('TAXFOLD_APP_STORE_ID', APP_STORE_ID),
    APP_STORE_PT: fromEnv('TAXFOLD_APP_STORE_PT', APP_STORE_PT),
  },
});

// Apple's "Download on the App Store" badge, US English, exactly as served by Apple Marketing Tools (see FRONTEND.md).
const BADGE_ART = { light: '/app-store-badge-black.svg', dark: '/app-store-badge-white.svg' };

// One credit line in every state, in the footer where the legal notice already is: Apple asks for a credit once per
// site, and every state's pages name these marks. Wording follows Apple's own attribution notices (Apple Trademark
// List and its legal footer, read 2026-11-06). The marks listed are the ones the site's pages use; a test fails when a
// page names an Apple mark this line omits.
const APPLE_CREDIT =
  'Apple, the Apple logo, iPhone, iPad, iCloud, Live Text, Safari, TestFlight and App Store are trademarks of Apple Inc., ' +
  'registered in the U.S. and other countries and regions. IOS is a trademark or registered trademark of Cisco in the ' +
  'U.S. and other countries and is used under license.';

const GUIDES_HREF = '#guides';
const PRIVACY_HREF = '/privacy/#app';
const READ_GUIDES = { kind: 'button', label: 'Read the receipt guides', href: GUIDES_HREF };

const missing = (name) => {
  throw new Error(`launch-state: LAUNCH_STATE needs ${name} to be set before it can render`);
};

export function launchView(state = effectiveLaunch().state, ids = effectiveLaunch().ids) {
  if (state === 'pre-beta') {
    return {
      state,
      primary: READ_GUIDES,
      secondary: { label: "What the app will and won’t collect", href: PRIVACY_HREF },
      pill: 'In development · not on the App Store yet',
      helper: null,
      priceLine: 'One-time purchase when it ships. No subscription.',
      makerStatus: 'Taxfold is in development and is not on the App Store yet.',
      metaStatus: 'In development.',
      privacyLabelLead: 'When the app is listed, its App Store privacy label will read',
      makerCta: null,
      itunesMeta: null,
      creditLine: APPLE_CREDIT,
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
      metaStatus: 'In public beta.',
      privacyLabelLead: 'When the app is listed, its App Store privacy label will read',
      makerCta: { label: 'Join the TestFlight beta', hrefFor: () => href },
      itunesMeta: null,
      creditLine: APPLE_CREDIT,
    };
  }
  if (state === 'released') {
    const id = ids.APP_STORE_ID || missing('APP_STORE_ID');
    const pt = ids.APP_STORE_PT;
    return {
      state,
      primary: { kind: 'badge', alt: 'Download Taxfold on the App Store', href: appStoreUrl(id, pt, SITE_CT), art: BADGE_ART },
      secondary: READ_GUIDES,
      pill: null,
      helper: null,
      priceLine: '$39.99 once. No subscription.',
      makerStatus: 'Taxfold is on the App Store.',
      metaStatus: '',
      privacyLabelLead: 'Its App Store privacy label reads',
      makerCta: { label: 'Get Taxfold on the App Store', hrefFor: (cluster) => appStoreUrl(id, pt, ctFromCluster(cluster)) },
      itunesMeta: (canonical) => `app-id=${id}, app-argument=${canonical}`,
      creditLine: APPLE_CREDIT,
    };
  }
  throw new Error(`launch-state: unknown LAUNCH_STATE ${JSON.stringify(state)}`);
}

// Apple's campaign link is https://apps.apple.com/app/id<ID>?pt=<provider>&ct=<campaign>&mt=8. Apple issues pt
// together with the first campaign link, and a ct without it attributes nothing, so with no pt the link is the plain
// store page and carries no query at all.
export const appStoreUrl = (id, pt, ct) => {
  const base = `https://apps.apple.com/app/id${id || missing('APP_STORE_ID')}`;
  return pt ? `${base}?pt=${encodeURIComponent(pt)}&ct=${encodeURIComponent(ct)}&mt=8` : base;
};

// Apple: a campaign token is up to 30 alphanumeric characters, spaces and a fixed punctuation set, with no space first
// or last (Apple, App Store Connect Analytics Help, "Campaign links"; read 2026-11-06).
const CAMPAIGN_TOKEN_CHARS = /^[A-Za-z0-9 \[\]/\\\-~+=<>:;,._‘“*&$%#@?!|{}()]+$/;
const CAMPAIGN_TOKEN_MAX = 30;

// A guide's frontmatter `cluster` is a comma-separated list ("core:receipt-scan-ocr, core:receipt-app-generic").
// Its first entry, without the `core:` prefix, is the guide's campaign token.
export function ctFromCluster(cluster) {
  const token = String(cluster ?? '').split(',')[0].trim().replace(/^core:/, '');
  if (!token || !CAMPAIGN_TOKEN_CHARS.test(token)) {
    throw new Error(`launch-state: cluster ${JSON.stringify(cluster)} does not give a valid Apple campaign token`);
  }
  if (token.length > CAMPAIGN_TOKEN_MAX) {
    throw new Error(`launch-state: campaign token ${JSON.stringify(token)} is over Apple's ${CAMPAIGN_TOKEN_MAX}-character limit`);
  }
  return token;
}
