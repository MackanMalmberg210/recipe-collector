import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getStripeServer, PRO_PLANS, getBaseSiteUrl, type ProPlanCycle } from "../../../../lib/stripe";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user via Bearer token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ") || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Please sign in or create an account to start a Pro subscription." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication session expired. Please sign in again." },
        { status: 401 }
      );
    }

    // 2. Initialize Stripe
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        {
          error: "Stripe payment processing is not configured yet. Please add STRIPE_SECRET_KEY to your environment variables.",
          notConfigured: true,
        },
        { status: 503 }
      );
    }

    // 3. Parse request body
    const body = await req.json().catch(() => ({}));
    const plan: ProPlanCycle = body.plan === "yearly" ? "yearly" : "monthly";
    const selectedPlan = PRO_PLANS[plan];
    const baseUrl = getBaseSiteUrl(req);

    // 4. Check if user already has a Stripe Customer ID stored in user_profiles
    let customerId: string | undefined;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    }

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      customer_email: customerId ? undefined : (user.email || undefined),
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.unitAmount,
            recurring: {
              interval: selectedPlan.interval,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
      metadata: {
        userId: user.id,
        plan,
      },
      success_url: `${baseUrl}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings?payment=cancelled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to generate Stripe checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("Stripe Checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
