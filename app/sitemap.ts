import { MetadataRoute } from 'next';
import { getCollection, COLLECTIONS } from '@/lib/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://codeplayer.app';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Get all shared codes for sitemap
    const codesCollection = await getCollection(COLLECTIONS.CODES);
    const sharedCodes = await codesCollection
      .find({})
      .project({ shareId: 1, updatedAt: 1 })
      .limit(1000) // Limit to prevent too large sitemap
      .toArray();

    const codeRoutes = sharedCodes.map((code: any) => ({
      url: `${baseUrl}/${code.shareId}`,
      lastModified: code.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    routes.push(...codeRoutes);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Continue with base routes even if database query fails
  }

  return routes;
}

