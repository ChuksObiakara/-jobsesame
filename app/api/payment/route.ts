import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, currency } = body;

    if (!email || !plan) {
      return NextResponse.json({ error: 'Missing email or plan' }, { status: 400 });
    }

    const amounts: Record<string, number> = {
      pro_usd: 2000,
      pro_zar: 37000,
      credits_usd: 1000,
      credits_zar: 18500,
    };

    const currencyCode = currency === 'ZAR' ? 'ZAR' : 'USD';
    const planKey = `${plan}_${currency === 'ZAR' ? 'zar' : 'usd'}`;
    const amount = amounts[planKey] || amounts.pro_usd;

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency: currencyCode,
        metadata: { plan },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Paystack initialization failed');
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment', details: String(error) },
      { status: 500 }
    );
  }
}
