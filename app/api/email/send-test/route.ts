import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { sendTestEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, html, css, js } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const userId = new ObjectId(user.userId);

    // Check user's email credits
    const userDoc = await usersCollection.findOne({ _id: userId });
    const credits = userDoc?.emailCredits || 0;

    if (credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient email credits. Please purchase credits to send emails.' },
        { status: 403 }
      );
    }

    try {
      await sendTestEmail(email, html || '', css || '', js || '');
      
      // Deduct credit and record email sent
      await usersCollection.updateOne(
        { _id: userId },
        {
          $inc: { emailCredits: -1 },
          $push: {
            emailsSent: {
              to: email,
              sentAt: new Date(),
            },
          },
        }
      );

      return NextResponse.json({ 
        message: 'Test email sent successfully',
        remainingCredits: credits - 1,
      });
    } catch (emailError) {
      console.error('Error sending test email:', emailError);
      return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
