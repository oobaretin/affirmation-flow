import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import {
  FREE_TRIAL_DAYS,
  SUBSCRIPTION_DISPLAY,
  SUBSCRIPTION_ENTITLEMENT_ID,
} from '../constants/subscription';
import { getEnv, isSubscriptionDevBypass } from '../config/env';

export type SubscriptionPlan = 'monthly' | 'yearly';

export type SubscriptionOffering = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
};

export type SubscriptionStatus = {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  expirationDate: string | null;
  willRenew: boolean;
};

let configured = false;

function getRevenueCatApiKey(): string {
  if (Platform.OS === 'ios') {
    return getEnv('EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY');
  }
  if (Platform.OS === 'android') {
    return getEnv('EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY');
  }
  return '';
}

export function canUseNativePurchases(): boolean {
  return (
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Boolean(getRevenueCatApiKey()) &&
    !isSubscriptionDevBypass()
  );
}

export function formatPackagePrice(pkg: PurchasesPackage | null, plan: SubscriptionPlan): string {
  if (pkg?.product?.priceString) return pkg.product.priceString;
  return SUBSCRIPTION_DISPLAY[plan].fallbackPrice;
}

export function formatPackagePeriod(plan: SubscriptionPlan): string {
  return SUBSCRIPTION_DISPLAY[plan].period;
}

export function formatPlanTrialNote(plan: SubscriptionPlan, pkg: PurchasesPackage | null): string {
  const price = formatPackagePrice(pkg, plan);
  const period = formatPackagePeriod(plan);
  return `${FREE_TRIAL_DAYS}-day free trial, then ${price}/${period}`;
}

function activeEntitlement(customerInfo: CustomerInfo) {
  return customerInfo.entitlements.active[SUBSCRIPTION_ENTITLEMENT_ID];
}

function mapCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
  const entitlement = activeEntitlement(customerInfo);
  if (!entitlement) {
    return {
      isActive: false,
      plan: null,
      expirationDate: null,
      willRenew: false,
    };
  }

  const productId = entitlement.productIdentifier.toLowerCase();
  const plan: SubscriptionPlan = productId.includes('year') ? 'yearly' : 'monthly';

  return {
    isActive: true,
    plan,
    expirationDate: entitlement.expirationDate ?? null,
    willRenew: entitlement.willRenew,
  };
}

function devBypassStatus(plan: SubscriptionPlan = 'yearly'): SubscriptionStatus {
  return {
    isActive: true,
    plan,
    expirationDate: null,
    willRenew: true,
  };
}

function inactiveStatus(): SubscriptionStatus {
  return {
    isActive: false,
    plan: null,
    expirationDate: null,
    willRenew: false,
  };
}

function ensureConfigured(): void {
  if (configured || !canUseNativePurchases()) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({ apiKey: getRevenueCatApiKey() });
  configured = true;
}

function mapOffering(current: NonNullable<Awaited<ReturnType<typeof Purchases.getOfferings>>['current']>): SubscriptionOffering {
  const monthly =
    current.monthly ??
    current.availablePackages.find((pkg) => pkg.packageType === 'MONTHLY') ??
    null;

  const yearly =
    current.annual ??
    current.availablePackages.find((pkg) => pkg.packageType === 'ANNUAL') ??
    null;

  return { monthly, yearly };
}

export async function initializeSubscription(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return devBypassStatus();
  }

  if (!canUseNativePurchases()) {
    return inactiveStatus();
  }

  try {
    ensureConfigured();
    const customerInfo = await Purchases.getCustomerInfo();
    return mapCustomerInfo(customerInfo);
  } catch {
    return inactiveStatus();
  }
}

export async function fetchOfferings(): Promise<SubscriptionOffering> {
  if (!canUseNativePurchases()) {
    return { monthly: null, yearly: null };
  }

  ensureConfigured();
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) {
    return { monthly: null, yearly: null };
  }

  return mapOffering(offerings.current);
}

export async function refreshSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return devBypassStatus();
  }

  if (!canUseNativePurchases()) {
    return inactiveStatus();
  }

  ensureConfigured();
  const customerInfo = await Purchases.getCustomerInfo();
  return mapCustomerInfo(customerInfo);
}

export async function purchasePlan(
  offering: SubscriptionOffering,
  plan: SubscriptionPlan,
): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return devBypassStatus(plan);
  }

  const pkg = plan === 'yearly' ? offering.yearly : offering.monthly;
  if (!pkg) {
    throw new Error(`The ${plan} plan is not available yet.`);
  }

  ensureConfigured();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return mapCustomerInfo(customerInfo);
}

export async function restoreSubscription(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return devBypassStatus();
  }

  if (!canUseNativePurchases()) {
    throw new Error('Restore purchases is only available in the native app.');
  }

  ensureConfigured();
  const customerInfo = await Purchases.restorePurchases();
  return mapCustomerInfo(customerInfo);
}

export { isSubscriptionDevBypass };
