import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareId } = params;
    const codesCollection = await getCollection(COLLECTIONS.CODES);

    const code = await codesCollection.findOne({ shareId });

    if (!code) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    const canEdit = code.userId?.toString() === user.userId.toString();
    return NextResponse.json({ canEdit });
  } catch (error) {
    console.error('Error in can-edit check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
