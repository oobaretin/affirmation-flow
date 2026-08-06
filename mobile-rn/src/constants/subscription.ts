export const SUBSCRIPTION_ENTITLEMENT_ID = 'premium';

export const FREE_TRIAL_DAYS = 7;

export const SUBSCRIPTION_PRODUCT_IDS = {
  monthly: 'com.affirmationflow.app.premium.monthly',
  yearly: 'com.affirmationflow.app.premium.yearly',
} as const;

export const SUBSCRIPTION_DISPLAY = {
  monthly: {
    label: 'Monthly',
    fallbackPrice: '$4.99',
    period: 'month',
  },
  yearly: {
    label: 'Annual',
    fallbackPrice: '$39.99',
    period: 'year',
    savingsLabel: 'Save 33%',
  },
} as const;

export const PAYWALL_FEATURES = [
  'Hear affirmations in a voice that feels human',
  'Daily practice tailored to your focus areas',
  'Mantra-style repeats with calm delivery',
  'Favorites, custom affirmations, and daily reminders',
] as const;

export const YEARLY_MONTHLY_EQUIVALENT = '$3.33';

export const SUBSCRIPTION_TRIAL_HEADLINE = `${FREE_TRIAL_DAYS}-day free trial on every plan`;

export function buildSubscriptionLegal(plan: 'monthly' | 'yearly', price: string): string {
  const period = SUBSCRIPTION_DISPLAY[plan].period;
  return (
    `Start with a ${FREE_TRIAL_DAYS}-day free trial, then ${price}/${period}. ` +
    'Payment is charged to your Apple ID when the trial ends unless you cancel at least 24 hours before it ends. ' +
    'Subscription automatically renews unless canceled at least 24 hours before the end of the current period. ' +
    'Manage or cancel anytime in App Store account settings.'
  );
}
