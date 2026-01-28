# PaymentIntegrator

Implement Stripe payment processing for MMarkov subscriptions.

## Usage

```
/payment-integrator implement <feature>
/payment-integrator setup stripe
/payment-integrator create pricing page
/payment-integrator webhook <event type>
/payment-integrator troubleshoot <issue>
```

## Agent Instructions

$import(.claude/agents/payment-integrator.md)

## Task

Implement payment and subscription functionality:

1. **Stripe Setup**: Products, prices, API keys, webhooks
2. **Backend**: Checkout sessions, portal sessions, subscription management
3. **Frontend**: Pricing page, payment components, subscription status
4. **Webhooks**: Handle payment events (success, failure, cancellation)
5. **Security**: PCI compliance, signature verification, secret key handling

Provides complete code examples for Python backend and Angular frontend.
