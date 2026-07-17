import { Capacitor } from '@capacitor/core';
import {
  LOG_LEVEL,
  Purchases,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import type { CustomerInfo } from '@revenuecat/purchases-typescript-internal-esm';
import {
  SUBSCRIPTION_DISPLAY,
  SUBSCRIPTION_ENTITLEMENT_ID,
} from '../constants/subscription';

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

const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

function getApiKey(): string | undefined {
  return import.meta.env.VITE_REVENUECAT_APPLE_API_KEY as string | undefined;
}

export function isSubscriptionDevBypass(): boolean {
  return (
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_SUBSCRIPTION_DEV_BYPASS === 'true'
  );
}

export function canUseNativePurchases(): boolean {
  return Capacitor.isNativePlatform() && Boolean(getApiKey()) && !isSubscriptionDevBypass();
}

export function formatPackagePrice(pkg: PurchasesPackage | null, plan: SubscriptionPlan): string {
  if (pkg?.product?.priceString) return pkg.product.priceString;
  return SUBSCRIPTION_DISPLAY[plan].fallbackPrice;
}

export function formatPackagePeriod(plan: SubscriptionPlan): string {
  return SUBSCRIPTION_DISPLAY[plan].period;
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

export async function initializeSubscription(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return {
      isActive: true,
      plan: 'yearly',
      expirationDate: null,
      willRenew: true,
    };
  }

  if (!canUseNativePurchases()) {
    return {
      isActive: false,
      plan: null,
      expirationDate: null,
      willRenew: false,
    };
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey: getApiKey()! });

  const { customerInfo } = await Purchases.getCustomerInfo();
  return mapCustomerInfo(customerInfo);
}

export async function fetchOfferings(): Promise<SubscriptionOffering> {
  if (!canUseNativePurchases()) {
    return { monthly: null, yearly: null };
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;

  if (!current) {
    return { monthly: null, yearly: null };
  }

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

export async function refreshSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return {
      isActive: true,
      plan: 'yearly',
      expirationDate: null,
      willRenew: true,
    };
  }

  if (!canUseNativePurchases()) {
    return {
      isActive: false,
      plan: null,
      expirationDate: null,
      willRenew: false,
    };
  }

  const { customerInfo } = await Purchases.getCustomerInfo();
  return mapCustomerInfo(customerInfo);
}

export async function purchasePlan(
  offering: SubscriptionOffering,
  plan: SubscriptionPlan,
): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return {
      isActive: true,
      plan,
      expirationDate: null,
      willRenew: true,
    };
  }

  const pkg = plan === 'yearly' ? offering.yearly : offering.monthly;
  if (!pkg) {
    throw new Error(`The ${plan} plan is not available yet.`);
  }

  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return mapCustomerInfo(result.customerInfo);
}

export async function restoreSubscription(): Promise<SubscriptionStatus> {
  if (isSubscriptionDevBypass()) {
    return {
      isActive: true,
      plan: 'yearly',
      expirationDate: null,
      willRenew: true,
    };
  }

  if (!canUseNativePurchases()) {
    throw new Error('Restore purchases is only available in the iOS app.');
  }

  const { customerInfo } = await Purchases.restorePurchases();
  return mapCustomerInfo(customerInfo);
}

export function openManageSubscriptions(): void {
  window.open(MANAGE_SUBSCRIPTIONS_URL, '_system');
}
