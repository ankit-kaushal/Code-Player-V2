import { Metadata } from 'next';
import { getCollection, COLLECTIONS } from '@/lib/database';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://codeplayer.app';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;

  try {
    const codesCollection = await getCollection(COLLECTIONS.CODES);
    const code = await codesCollection.findOne({ shareId: id });

    if (!code) {
      return {
        title: 'Code Not Found | Code Player',
        description: 'The requested code snippet could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const title = `Shared Code - ${id} | Code Player`;
    const description = code.html || code.css || code.js
      ? `View and edit this shared code snippet. ${code.html ? 'HTML' : ''} ${code.css ? 'CSS' : ''} ${code.js ? 'JavaScript' : ''} code.`
      : 'View and edit this shared code snippet on Code Player.';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${siteUrl}/${id}`,
        siteName: 'Code Player',
        type: 'website',
        images: [
          {
            url: `${siteUrl}/logo.png`,
            width: 1200,
            height: 630,
            alt: 'Code Player',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${siteUrl}/logo.png`],
      },
      alternates: {
        canonical: `${siteUrl}/${id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Shared Code | Code Player',
      description: 'View and edit shared code snippets on Code Player.',
    };
  }
}

export default function SharedCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

