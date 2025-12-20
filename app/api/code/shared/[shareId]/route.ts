import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    const codesCollection = await getCollection(COLLECTIONS.CODES);

    const code = await codesCollection.findOne({ shareId });

    if (!code) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    return NextResponse.json({
      html: code.html,
      css: code.css,
      js: code.js,
      shareId: code.shareId,
      userId: code.userId?.toString(),
      createdAt: code.createdAt,
      updatedAt: code.updatedAt
    });
  } catch (error) {
    console.error('Error in get shared code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
