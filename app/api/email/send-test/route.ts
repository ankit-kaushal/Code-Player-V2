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

    const emailSentCollection = await getCollection(COLLECTIONS.EMAIL_SENT);

    // Check if user has already sent an email
    const record = await emailSentCollection.findOne({
      userId: new ObjectId(user.userId)
    });

    if (record) {
      return NextResponse.json(
        { error: 'You have already sent a test email. Only one test email is allowed per account.' },
        { status: 403 }
      );
    }

    try {
      await sendTestEmail(email, html || '', css || '', js || '');
      
      // Record that email was sent
      await emailSentCollection.insertOne({
        userId: new ObjectId(user.userId),
        sentAt: new Date()
      });

      return NextResponse.json({ message: 'Test email sent successfully' });
    } catch (emailError) {
      console.error('Error sending test email:', emailError);
      return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
