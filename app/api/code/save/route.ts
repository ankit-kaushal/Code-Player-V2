import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/slug-generator';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { html, css, js, shareId } = await req.json();
    const codesCollection = await getCollection(COLLECTIONS.CODES);

    if (shareId) {
      // Update existing shared code
      const result = await codesCollection.updateOne(
        { shareId, userId: new ObjectId(user.userId) },
        {
          $set: {
            html: html || '',
            css: css || '',
            js: js || '',
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Code not found or unauthorized' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Code updated', shareId });
    } else {
      // Create new code with short slug
      const newShareId = await generateUniqueSlug(7);
      await codesCollection.insertOne({
        userId: new ObjectId(user.userId),
        shareId: newShareId,
        html: html || '',
        css: css || '',
        js: js || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return NextResponse.json({ message: 'Code saved', shareId: newShareId });
    }
  } catch (error) {
    console.error('Error in save code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
