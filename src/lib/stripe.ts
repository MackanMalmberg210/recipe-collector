import Stripe from "stripe";

// Lazily initialize Stripe server instance
let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as any,
      appInfo: {
        name: "Culineer",
        version: "1.0.0",
      },
    });
  }

  return stripeInstance;
}

export type ProPlanCycle = "monthly" | "yearly";

export interface PlanConfig {
  name: string;
  description: string;
  unitAmount: number; // in cents
  currency: string;
  interval: "month" | "year";
}

export const PRO_PLANS: Record<ProPlanCycle, PlanConfig> = {
  monthly: {
    name: "Chef Pro (Monthly)",
    description: "Full access to AI vision scan, macros, and cloud sync - billed monthly.",
    unitAmount: 499, // $4.99
    currency: "usd",
    interval: "month",
  },
  yearly: {
    name: "Chef Pro (Annual)",
    description: "Full access to AI vision scan, macros, and cloud sync - billed annually (Save 20%).",
    unitAmount: 4788, // $47.88/year ($3.99/mo)
    currency: "usd",
    interval: "year",
  },
};

/**
 * Resolves the appropriate base URL for Stripe redirect callbacks.
 * Automatically prefers Vercel production URL, request origin, or env variable.
 */
export function getBaseSiteUrl(req?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (req) {
    const origin = req.headers.get("origin");
    if (origin) return origin.replace(/\/$/, "");

    const host = req.headers.get("host");
    if (host) {
      const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      return `${proto}://${host}`;
    }
  }

  return "https://recipe-collector-flax.vercel.app";
}
