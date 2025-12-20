import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

    let verifiedPaymentId = paymentId || 'N/A';

    // If we have orderToken, verify payment status with Cashfree API
    if (orderToken) {
      try {
        const cashfreeResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'x-api-version': '2023-08-01',
            'x-client-id': process.env.CASHFREE_APP_ID || '',
            'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          },
        });

        const orderData = await cashfreeResponse.json();

        if (!cashfreeResponse.ok || orderData.order_status !== 'PAID') {
          return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // Payment is verified, get payment ID
        verifiedPaymentId = orderData.payment_details?.cf_payment_id || paymentId || 'N/A';
      } catch (error) {
        console.error('Error verifying with Cashfree:', error);
        return NextResponse.json({ error: 'Failed to verify payment status' }, { status: 500 });
      }
    } else if (signature && paymentId) {
      // Verify signature if provided
      const dataToVerify = `${orderId}${paymentId}`;
      const secretKey = process.env.CASHFREE_SECRET_KEY || '';
      const generatedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(dataToVerify)
        .digest('hex');

      if (generatedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
      verifiedPaymentId = paymentId;
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
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
