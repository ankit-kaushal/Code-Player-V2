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

    const cashfreeAppId = process.env.CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox';

    if (!cashfreeAppId || !cashfreeSecretKey) {
      console.error('Cashfree credentials missing:', {
        hasAppId: !!cashfreeAppId,
        hasSecretKey: !!cashfreeSecretKey,
      });
      return NextResponse.json(
        { error: 'Cashfree credentials not configured. Please check CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.' },
        { status: 500 }
      );
    }

    const apiUrl = cashfreeMode === 'production' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    console.log('Creating Cashfree order:', {
      mode: cashfreeMode,
      apiUrl,
      orderId,
      orderAmount: packageData.price,
      hasAppId: !!cashfreeAppId,
      hasSecretKey: !!cashfreeSecretKey,
    });

    const cashfreeResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
      },
      body: JSON.stringify(sessionData),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', {
        status: cashfreeResponse.status,
        statusText: cashfreeResponse.statusText,
        response: JSON.stringify(cashfreeData, null, 2),
        mode: cashfreeMode,
        apiUrl,
      });
      
      let errorMessage = 'Failed to create payment session';
      if (cashfreeResponse.status === 401 || cashfreeResponse.status === 403) {
        errorMessage = 'Cashfree authentication failed. Please check your CASHFREE_APP_ID and CASHFREE_SECRET_KEY. Make sure you are using the correct credentials for ' + cashfreeMode + ' mode.';
      } else if (cashfreeData.message) {
        errorMessage = cashfreeData.message;
      } else if (cashfreeData.error?.message) {
        errorMessage = cashfreeData.error.message;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: cashfreeResponse.status || 500 }
      );
    }

    console.log('Cashfree order response:', JSON.stringify(cashfreeData, null, 2));

    // Cashfree returns payment_session_id in the response
    const paymentSessionId = cashfreeData.payment_session_id || cashfreeData.paymentSessionId || cashfreeData.payment_sessionId;
    
    if (!paymentSessionId) {
      console.error('Cashfree response missing payment_session_id. Full response:', JSON.stringify(cashfreeData, null, 2));
      return NextResponse.json(
        { error: 'Payment session ID not found in response. Please check Cashfree API response structure.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentSessionId,
      orderId: cashfreeData.order_id || orderId,
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

