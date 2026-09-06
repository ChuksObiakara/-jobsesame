import crypto from 'crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

function ls_headers() {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  };
}

/**
 * Creates a Lemon Squeezy hosted checkout session for the Pro subscription
 * and returns the checkout URL to redirect the user to.
 */
export async function createLemonSqueezyCheckout(opts: {
  email: string;
  redirectUrl: string;
  custom: Record<string, string>;
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  if (!storeId || !variantId || !process.env.LEMONSQUEEZY_API_KEY) {
    throw new Error('Lemon Squeezy is not configured (missing store/variant/API key)');
  }

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: ls_headers(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: opts.email,
            custom: opts.custom,
          },
          product_options: {
            redirect_url: opts.redirectUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  });

  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.data?.attributes?.url) {
    const message = json?.errors?.[0]?.detail || 'Failed to create Lemon Squeezy checkout';
    throw new Error(message);
  }
  return json.data.attributes.url as string;
}

/**
 * Cancels a Lemon Squeezy subscription (the customer keeps access until the
 * end of the current billing period — Lemon Squeezy sets `ends_at` and we
 * mirror that onto our own `proExpiresAt`, same pattern as new subscriptions).
 */
export async function cancelLemonSqueezySubscription(subscriptionId: string): Promise<void> {
  const res = await fetch(`${LS_API_BASE}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: ls_headers(),
  });
  if (!res.ok) {
    const json: any = await res.json().catch(() => null);
    throw new Error(json?.errors?.[0]?.detail || 'Failed to cancel Lemon Squeezy subscription');
  }
}

/**
 * Verifies the `X-Signature` header Lemon Squeezy sends on every webhook
 * request: HMAC-SHA256 of the raw request body, keyed with the webhook's
 * signing secret, hex-encoded.
 */
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
