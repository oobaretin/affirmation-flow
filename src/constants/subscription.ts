export const SUBSCRIPTION_ENTITLEMENT_ID = 'premium';

export const SUBSCRIPTION_PRODUCT_IDS = {
  monthly: 'com.affirmationflow.app.premium.monthly',
  yearly: 'com.affirmationflow.app.premium.yearly',
} as const;

export const SUBSCRIPTION_DISPLAY = {
  monthly: {
    label: 'Monthly',
    fallbackPrice: '$2.99',
    period: 'month',
  },
  yearly: {
    label: 'Annual',
    fallbackPrice: '$19.99',
    period: 'year',
    savingsLabel: 'Save 44%',
  },
} as const;

export const PAYWALL_FEATURES = [
  'Daily affirmations tailored to your focus areas',
  'Soothing voice playback with mantra repeats',
  'Library, favorites, streaks, and reminders',
  'AI affirmation generator included',
] as const;

export const SUBSCRIPTION_LEGAL =
  'Payment is charged to your Apple ID account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage or cancel anytime in App Store account settings.';
