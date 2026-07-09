import Stripe from "stripe";
import { db } from "./db";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "MY_STRIPE_SECRET_KEY") {
      console.warn("WARNING: STRIPE_SECRET_KEY is not configured. Running Stripe in high-fidelity mock mode.");
      return null;
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as any,
    });
  }
  return stripeClient;
}

/**
 * Syncs the detailed Stripe subscription status directly with the SQLite database.
 * This guarantees frontend queries never rely on public client-side data.
 */
export async function syncSubscriptionToDatabase(subscription: Stripe.Subscription) {
  const sub = subscription as any;
  const customerId = sub.customer as string;
  const status = sub.status;
  const subscriptionId = sub.id;
  
  // Convert period timestamps to standard ISO strings
  const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
  const cancelAtPeriodEnd = sub.cancel_at_period_end ? 1 : 0;
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
  
  // Inspect items to find subscription interval
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval || "month";
  const planName = interval === "year" ? "yearly" : "monthly";

  // Active plans, trial periods, and brief payment grace periods (past_due) all enjoy Premium status.
  // Unpaid, canceled, or expired trials fallback directly to Free.
  const isPremium = ["active", "trialing", "past_due"].includes(status);
  const dbStatus = isPremium ? "premium" : "free";

  console.log(`[STRIPE SYNC] Customer: ${customerId} | Subscription: ${subscriptionId} | Status: ${status} | Plan: ${planName} | Period End: ${periodEnd}`);

  // Update DB record
  const user = db.prepare("SELECT id FROM users WHERE stripe_customer_id = ?").get(customerId) as any;
  if (user) {
    db.prepare(`
      UPDATE users 
      SET subscription_status = ?, 
          stripe_subscription_id = ?, 
          subscription_plan = ?, 
          subscription_period_end = ?, 
          subscription_cancel_at_period_end = ?, 
          subscription_trial_end = ?
      WHERE id = ?
    `).run(
      dbStatus, 
      subscriptionId, 
      isPremium ? planName : "free", 
      periodEnd, 
      cancelAtPeriodEnd, 
      trialEnd, 
      user.id
    );
  } else {
    // If the webhook comes before checkout metadata processes, we search for customerId via existing checkout logic or email.
    console.warn(`[STRIPE SYNC WARNING] Customer ${customerId} has no registered local account yet.`);
  }
}

/**
 * Creates a Stripe checkout session for Daynest Premium subscription.
 * Supports Monthly ($9.99/mo) and Yearly ($79.99/yr) plans, each starting with a 7-day free trial.
 */
export async function createCheckoutSession(
  userId: string, 
  userEmail: string, 
  origin: string, 
  plan: "monthly" | "yearly" = "monthly"
): Promise<string> {
  const stripe = getStripe();
  
  if (!stripe) {
    // High-fidelity Mock redirect URL if Stripe key isn't provided
    console.log(`[STRIPE MOCK] Stripe not configured. Generating high-fidelity mock checkout for ${plan}.`);
    return `${origin}/?stripe_status=success&mock_plan=${plan}&mock_trial=true`;
  }

  // Find or create customer
  const user = db.prepare("SELECT email, stripe_customer_id FROM users WHERE id = ?").get(userId) as any;
  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, userId);
  }

  // Price parameters for the chosen plan
  const unitAmount = plan === "yearly" ? 7999 : 999; // $79.99/yr or $9.99/mo
  const interval = plan === "yearly" ? "year" : "month";
  const productName = plan === "yearly" ? "Daynest Premium (Annual Membership)" : "Daynest Premium (Monthly Membership)";
  const productDescription = plan === "yearly" 
    ? "Save 33%! Best Value. Durable Cloud Backup, Complete AI Coaching, and Unlimited Encrypted Logs."
    : "Flexible Monthly Plan. Durable Cloud Backup, Complete AI Coaching, and Unlimited Encrypted Logs.";

  // Create Checkout Session with 7-Day Free Trial
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: unitAmount,
          recurring: { interval: interval as any },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId },
    },
    success_url: `${origin}/?stripe_status=success&plan=${plan}`,
    cancel_url: `${origin}/?stripe_status=cancelled`,
    metadata: { userId, plan },
  });

  return session.url!;
}

/**
 * Creates a Stripe billing portal session to let users manage their subscriptions.
 */
export async function createPortalSession(userId: string, origin: string): Promise<string> {
  const stripe = getStripe();
  
  if (!stripe) {
    console.log("[STRIPE MOCK] Creating mock portal session redirect.");
    return `${origin}/?tab=profile&portal_status=returned_mock`;
  }

  const user = db.prepare("SELECT stripe_customer_id FROM users WHERE id = ?").get(userId) as any;
  const customerId = user?.stripe_customer_id;

  if (!customerId) {
    throw new Error("No active billing profile found. Please subscribe to Premium first.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/?tab=profile&portal_status=returned`,
  });

  return session.url;
}

/**
 * Handle verified Stripe webhooks with zero-trust backend synchronization.
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  const stripe = getStripe();
  if (!stripe) return;

  console.log(`[STRIPE WEBHOOK] Received secure event type: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId && customerId) {
        // Link customer to user ID first to guarantee mapping is correct
        db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
          .run(customerId, userId);
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToDatabase(subscription);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionToDatabase(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (customerId) {
        // Downgrade user immediately to free plan
        db.prepare(`
          UPDATE users 
          SET subscription_status = 'free', 
              subscription_plan = 'free',
              stripe_subscription_id = NULL,
              subscription_period_end = NULL,
              subscription_cancel_at_period_end = 0,
              subscription_trial_end = NULL
          WHERE stripe_customer_id = ?
        `).run(customerId);
        console.log(`[STRIPE WEBHOOK] Subscription terminated. User matching Customer ID ${customerId} downgraded to standard free tier.`);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToDatabase(subscription);
        console.log(`[STRIPE WEBHOOK] Invoice paid. Subscription state synced successfully for subscription ${subscriptionId}`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      if (customerId) {
        // In the event of failed renewals, downgrade immediately or set to past_due if subscription status reflects it
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionToDatabase(subscription);
        } else {
          db.prepare("UPDATE users SET subscription_status = 'free', subscription_plan = 'free' WHERE stripe_customer_id = ?")
            .run(customerId);
        }
        console.log(`[STRIPE WEBHOOK] Invoice payment failed. Restricting premium access for customer: ${customerId}`);
      }
      break;
    }

    default:
      console.log(`[STRIPE WEBHOOK] Received unhandled event: ${event.type}`);
  }
}
