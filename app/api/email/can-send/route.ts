import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailSentCollection = await getCollection(COLLECTIONS.EMAIL_SENT);
    const record = await emailSentCollection.findOne({
      userId: new ObjectId(user.userId)
    });

    return NextResponse.json({ canSend: !record });
  } catch (error) {
    console.error('Error in can-send check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
