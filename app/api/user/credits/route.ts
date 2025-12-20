import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const userDoc = await usersCollection.findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { emailCredits: 1, paymentHistory: 1 } }
    );

    return NextResponse.json({
      credits: userDoc?.emailCredits || 0,
      paymentHistory: userDoc?.paymentHistory || [],
    });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

