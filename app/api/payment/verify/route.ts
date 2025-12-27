import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { ObjectId } from 'mongodb';

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

    const { orderId, paymentId, signature, orderToken, packageId } = await req.json();

    if (!orderId || !packageId) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    // Verify payment status with Cashfree API
    const cashfreeBaseUrl = process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production'
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID || '',
        'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
      },
    });

    if (!cashfreeResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch order status from Cashfree' }, { status: 400 });
    }

    const orderData = await cashfreeResponse.json();

    if (orderData.order_status !== 'PAID') {
      return NextResponse.json({ 
        error: 'Payment not completed',
        orderStatus: orderData.order_status 
      }, { status: 400 });
    }

    // Extract payment ID from order data
    let verifiedPaymentId = 
      orderData.payment_details?.cf_payment_id ||
      orderData.payment_details?.payment_id ||
      orderData.payment_details?.[0]?.cf_payment_id ||
      orderData.payment_details?.[0]?.payment_id ||
      orderData.payments?.[0]?.cf_payment_id ||
      orderData.payments?.[0]?.payment_id ||
      orderData.cf_payment_id ||
      orderData.payment_id ||
      paymentId ||
      'N/A';

    // If payment ID not found in order data, fetch from payments endpoint
    if (!verifiedPaymentId || verifiedPaymentId === 'N/A') {
      const paymentsResponse = await fetch(`${cashfreeBaseUrl}/pg/orders/${orderId}/payments`, {
        method: 'GET',
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
        },
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (Array.isArray(paymentsData) && paymentsData.length > 0) {
          verifiedPaymentId = paymentsData[0].cf_payment_id || paymentsData[0].payment_id || verifiedPaymentId;
        } else if (paymentsData.payments && Array.isArray(paymentsData.payments) && paymentsData.payments.length > 0) {
          verifiedPaymentId = paymentsData.payments[0].cf_payment_id || paymentsData.payments[0].payment_id || verifiedPaymentId;
        }
      }
    }

    // Verify package
    if (!(packageId in EMAIL_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const packageData = EMAIL_PACKAGES[packageId as keyof typeof EMAIL_PACKAGES];

    // Update user's email credits
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const userId = new ObjectId(user.userId);

    const userDoc = await usersCollection.findOne({ _id: userId });
    const currentCredits = userDoc?.emailCredits || 0;
    const newCredits = currentCredits + packageData.emails;

    await usersCollection.updateOne(
      { _id: userId },
      {
        $set: {
          emailCredits: newCredits,
        },
        $push: {
          paymentHistory: {
            orderId,
            paymentId: verifiedPaymentId,
            packageId,
            emails: packageData.emails,
            amount: packageData.price,
            date: new Date(),
          },
        } as any,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added',
      credits: newCredits,
      addedCredits: packageData.emails,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
