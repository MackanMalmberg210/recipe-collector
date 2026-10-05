import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getStripeServer } from "../../../../lib/stripe";
import type Stripe from "stripe";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe server is not configured." },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig || !WEBHOOK_SECRET) {
    console.warn("Stripe webhook invoked without signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret or signature missing." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error(`Stripe Webhook signature verification failed: ${msg}`);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId) {
          const { error } = await supabase
            .from("user_profiles")
            .update({
              subscription_tier: "pro",
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscriptionId || null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Failed to update user profile on checkout:", error);
          } else {
            console.log(`User ${userId} successfully upgraded to Chef Pro!`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        const status = subscription.status;
        const isPro = status === "active" || status === "trialing";

        if (customerId) {
          const { error } = await supabase
            .from("user_profiles")
            .update({
              subscription_tier: isPro ? "pro" : "free",
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("Failed to update subscription status:", error);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          const { error } = await supabase
            .from("user_profiles")
            .update({
              subscription_tier: "free",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("Failed to reset subscription on cancellation:", error);
          } else {
            console.log(`Subscription deleted for customer ${customerId}, reset to free.`);
          }
        }
        break;
      }

      default:
        // Ignore unhandled event types gracefully
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
