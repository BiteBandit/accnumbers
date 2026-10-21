import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function getPricingConfig() {
  const defaults = {
    defaultMarkup: 1,
    usdToNgnRate: 1500,
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['markup_multiplier', 'usd_to_ngn', 'usdt_rate']);

    if (error || !data) return defaults;

    const markupRow = data.find(
      (row) => row.key === 'markup_multiplier'
    );

    const rateRow =
      data.find((row) => row.key === 'usd_to_ngn') ??
      data.find((row) => row.key === 'usdt_rate');

    const markup = Number(markupRow?.value);
    const rate = Number(rateRow?.value);

    return {
      defaultMarkup:
        Number.isFinite(markup) && markup > 0
          ? markup
          : defaults.defaultMarkup,
      usdToNgnRate:
        Number.isFinite(rate) && rate > 0
          ? rate
          : defaults.usdToNgnRate,
    };
  } catch (error) {
    console.error('[API BUY] Failed to load pricing configuration:', error);
    return defaults;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response: Response) {
  const body = await response.text();

  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function json(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control':
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function validSegment(value: string) {
  return /^[a-z0-9_-]{1,100}$/.test(value);
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      country: string;
      operator: string;
      product: string;
    }>;
  }
) {
  try {
    const { country: rawCountry, operator: rawOperator, product: rawProduct } =
      await params;

    const country = String(rawCountry ?? '').trim().toLowerCase();
    const operator = String(rawOperator ?? '').trim().toLowerCase();
    const product = String(rawProduct ?? '').trim().toLowerCase();

    if (
      !validSegment(country) ||
      !validSegment(operator) ||
      !validSegment(product)
    ) {
      return json(
        { error: 'Invalid country, operator, or product parameter.' },
        400
      );
    }

    // Authenticate API key.
    const authorization = request.headers.get('authorization') ?? '';
    const apiKeyHeader = request.headers.get('x-api-key') ?? '';

    const token = /^Bearer\s+/i.test(authorization)
      ? authorization.replace(/^Bearer\s+/i, '').trim()
      : authorization.trim() || apiKeyHeader.trim();

    if (!token || token.length > 4096) {
      return json({ error: 'A valid API key is required.' }, 401);
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, status, scopes')
      .eq('key', token)
      .maybeSingle();

    if (
      keyError ||
      !keyData ||
      keyData.status !== 'active' ||
      !keyData.user_id
    ) {
      return json({ error: 'Invalid or inactive API key.' }, 401);
    }

    let scopes: Record<string, unknown> = {};

    try {
      scopes =
        typeof keyData.scopes === 'string'
          ? JSON.parse(keyData.scopes)
          : keyData.scopes ?? {};
    } catch {
      scopes = {};
    }

    if (scopes.purchase !== true) {
      return json(
        { error: 'Your API key does not have purchase permission.' },
        403
      );
    }

    const providerKey =
      process.env.SIM5_API_KEY ||
      process.env.GRIZZLY_API_KEY ||
      '';

    if (!providerKey) {
      return json(
        { error: 'The purchase service is temporarily unavailable.' },
        503
      );
    }

    // Retrieve the current product price.
    let catalogResponse: Response;

    try {
      catalogResponse = await fetchWithTimeout(
        `https://5sim.net/v1/guest/products/${encodeURIComponent(country)}/${encodeURIComponent(operator)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${providerKey}`,
            Accept: 'application/json',
          },
        }
      );
    } catch {
      return json(
        { error: 'Unable to check product availability. Please try again.' },
        502
      );
    }

    if (!catalogResponse.ok) {
      return json(
        { error: 'Unable to check product availability. Please try again.' },
        502
      );
    }

    const catalog = await readJson(catalogResponse);

    if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
      return json(
        { error: 'Invalid product catalog response.' },
        502
      );
    }

    const productDetails = (
      catalog as Record<string, Record<string, unknown>>
    )[product];

    const basePrice = Number(
      productDetails?.Price ??
      productDetails?.cost ??
      productDetails?.price ??
      0
    );

    const quantity = Number(
      productDetails?.Qty ?? productDetails?.count ?? 0
    );

    if (
      !productDetails ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0 ||
      (Number.isFinite(quantity) && quantity <= 0)
    ) {
      return json(
        { error: 'The selected product is unavailable or out of stock.' },
        409
      );
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();
    const finalPrice = Math.ceil(
      basePrice * defaultMarkup * usdToNgnRate
    );

    if (!Number.isSafeInteger(finalPrice) || finalPrice <= 0) {
      return json({ error: 'Unable to calculate the purchase price.' }, 503);
    }

    // Preliminary balance check for a helpful error message.
    // The RPC below remains the authoritative balance check.
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', keyData.user_id)
      .maybeSingle();

    if (walletError) {
      console.error('[API BUY] Wallet lookup failed:', walletError);

      return json(
        { error: 'Unable to verify wallet balance. Please try again.' },
        503
      );
    }

    if (!wallet) {
      return json({ error: 'Wallet not found.' }, 404);
    }

    const balance = Number(wallet.balance);

    if (!Number.isFinite(balance) || balance < finalPrice) {
      return json({ error: 'Insufficient wallet balance.' }, 400);
    }

    /*
     * Atomically deduct funds through the Supabase RPC.
     * The RPC must perform its own balance >= amount check.
     */
    const { data: debitResult, error: debitError } =
      await supabaseAdmin.rpc('deduct_wallet_balance', {
        p_user_id: keyData.user_id,
        p_amount: finalPrice,
      });

    if (debitError || !debitResult) {
      console.error('[API BUY] Atomic wallet deduction failed:', debitError);

      return json(
        { error: 'Unable to reserve wallet funds. Please try again.' },
        400
      );
    }

    const debit = Array.isArray(debitResult)
      ? debitResult[0]
      : debitResult;

    const newBalance = Number(debit?.balance_after);

    if (!Number.isFinite(newBalance)) {
      console.error('[API BUY] RPC returned an invalid balance result.');

      return json(
        { error: 'Unable to confirm wallet deduction. Contact support.' },
        500
      );
    }

    /*
     * Purchase the number after the atomic deduction.
     * This endpoint deliberately contains no refund logic.
     */
    let providerResponse: Response;

    try {
      providerResponse = await fetchWithTimeout(
        `https://5sim.net/v1/user/buy/activation/${encodeURIComponent(country)}/${encodeURIComponent(operator)}/${encodeURIComponent(product)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${providerKey}`,
            Accept: 'application/json',
          },
        },
        20000
      );
    } catch (error) {
      console.error('[API BUY] Purchase result could not be confirmed:', error);

      return json(
        {
          error:
            'Purchase status could not be confirmed. Contact support before retrying.',
        },
        502
      );
    }

    const upstreamOrder = await readJson(providerResponse);

    if (
      !providerResponse.ok ||
      !upstreamOrder ||
      typeof upstreamOrder !== 'object' ||
      Array.isArray(upstreamOrder)
    ) {
      console.error(
        '[API BUY] Provider did not return a confirmed order:',
        providerResponse.status
      );

      return json(
        {
          error:
            'Purchase could not be confirmed. Contact support before retrying.',
        },
        502
      );
    }

    const order = upstreamOrder as Record<string, unknown>;
    const externalOrderId = String(order.id ?? order.ID ?? '');
    const phone = String(order.phone ?? order.number ?? '');

    if (!externalOrderId || !phone) {
      console.error('[API BUY] Provider response is missing order details.');

      return json(
        {
          error:
            'The purchase needs verification. Contact support before retrying.',
        },
        502
      );
    }

    const expires =
      typeof order.expires === 'string'
        ? order.expires
        : new Date(Date.now() + 20 * 60 * 1000).toISOString();

    // Save the rental record.
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .insert({
        user_id: keyData.user_id,
        service: product,
        country,
        phone_number: phone,
        status: 'pending',
        amount: finalPrice.toFixed(2),
        external_order_id: externalOrderId,
        operator,
        expires_at: expires,
        sms: [],
      })
      .select('id, created_at')
      .single();

    if (rentalError || !rental) {
      console.error('[API BUY] Rental persistence failed:', {
        externalOrderId,
        error: rentalError,
      });

      return json(
        {
          error:
            'The number was purchased but the rental record could not be saved. Contact support.',
          id: externalOrderId,
          phone,
        },
        500
      );
    }

    // Record the debit transaction.
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: keyData.user_id,
        description: `Virtual number rental for ${product.toUpperCase()} (${country.toUpperCase()})`,
        reference: `rental_${rental.id}`,
        type: 'debit',
        amount: finalPrice.toFixed(2),
        balance_after: newBalance.toFixed(2),
        status: 'completed',
      });

    if (transactionError) {
      console.error('[API BUY] Transaction logging failed:', {
        rentalId: rental.id,
        error: transactionError,
      });
    }

    // Send the in-app notification.
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: keyData.user_id,
        title: 'Number Purchased',
        message: `Successfully purchased a virtual number for ${product.toUpperCase()} for ₦${finalPrice}.`,
        read: false,
      });

    if (notificationError) {
      console.error('[API BUY] Notification creation failed:', notificationError);
    }

    return json({
      id: order.id ?? order.ID,
      phone,
      operator,
      product,
      price: finalPrice,
      status: 'PENDING',
      expires,
      sms: [],
      created_at: rental.created_at ?? new Date().toISOString(),
      country,
    });
  } catch (error) {
    console.error('[API BUY] Unexpected error:', error);

    return json(
      { error: 'An unexpected error occurred while processing the purchase.' },
      500
    );
  }
}