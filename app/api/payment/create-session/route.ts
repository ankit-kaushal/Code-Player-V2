import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const EMAIL_PACKAGES = {
  '1': { emails: 1, price: 5.00 },
  '5': { emails: 5, price: 20.00 },
  '10': { emails: 10, price: 40.00 },
  '100': { emails: 100, price: 350.00 },
} as const;

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await req.json();

    if (!packageId || !(packageId in EMAIL_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const packageData = EMAIL_PACKAGES[packageId as keyof typeof EMAIL_PACKAGES];
    const orderId = `order_${user.userId}_${Date.now()}`;

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'https://localhost:3000';
      }
    }
    
    if (!baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace(/^https?:\/\//, 'https://');
    }
    
    const returnUrl = `${baseUrl}/account?payment_status=success&orderId=${orderId}&packageId=${packageId}`;
    const notifyUrl = `${baseUrl}/api/payment/webhook`;

    const sessionData: any = {
      order_id: orderId,
      order_amount: packageData.price,
      order_currency: 'INR',
      order_note: `Purchase ${packageData.emails} email credits`,
      customer_details: {
        customer_id: user.userId,
        customer_email: user.email || '',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
    };

    const cashfreeResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID || '',
        'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
      },
      body: JSON.stringify(sessionData),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      return NextResponse.json(
        { error: cashfreeData.message || 'Failed to create payment session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentSessionId: cashfreeData.payment_session_id,
      orderId,
      orderAmount: packageData.price,
      orderCurrency: 'INR',
      packageId,
      packageData: {
        emails: packageData.emails,
        price: packageData.price,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    );
  }
}

