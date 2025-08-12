import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../services/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

function needStripe(_req, res, next) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID_PRO) {
    return res.status(500).json({ error: 'Stripe no configurado' });
  }
  next();
}

router.post('/billing/checkout', needStripe, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No auth' });
    let { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    const email = req.user.email || profile?.email;
    let cust = profile?.stripe_customer_id;
    if (!cust) {
      const c = await stripe.customers.create({ email, metadata: { user_id: userId } });
      cust = c.id;
      await supabaseAdmin.from('profiles').upsert({ id: userId, email, stripe_customer_id: cust });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: cust,
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || ''}/billing/success`,
      cancel_url: `${process.env.FRONTEND_URL || ''}/billing/cancel`
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/billing/portal', needStripe, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();
    if (!profile?.stripe_customer_id) return res.status(400).json({ error: 'Sin cliente Stripe' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: process.env.FRONTEND_URL || ''
    });
    res.json({ url: portal.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send('No webhook secret');
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    const setPlan = async (customer, plan) => {
      const { data: u } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customer).limit(1);
      if (u && u.length) await supabaseAdmin.from('profiles').update({ plan }).eq('id', u[0].id);
    };

    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
      await setPlan(event.data.object.customer, 'pro');
    }
    if (event.type === 'customer.subscription.deleted') {
      await setPlan(event.data.object.customer, 'free');
    }

    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(400).send('Webhook Error: ' + e.message);
  }
});

export default router;
