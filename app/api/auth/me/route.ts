import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const userDoc = await usersCollection.findOne(
    { _id: new ObjectId(user.userId) },
    { projection: { email: 1, name: 1, phone: 1 } }
  );

  return NextResponse.json({
    userId: user.userId,
    email: user.email,
    name: userDoc?.name || null,
    phone: userDoc?.phone || null
  });
}

