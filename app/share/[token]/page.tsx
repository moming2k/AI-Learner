import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dbShareLinks, getDbPages } from '@/lib/db';
import { hashShareToken } from '@/lib/share-links';
import SharedPageView from '@/components/SharedPageView';

export const dynamic = 'force-dynamic';

const APP_NAME = 'AI-Learner';

function getShareBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.AUTH_AGENTKEA_APP_URL ||
    'https://notes.agentkea.com'
  );
}

function cleanContent(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[>#\-*+]+\s*/gm, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDescription(content: string): string {
  const plain = cleanContent(content);

  if (!plain) {
    return 'Shared page from AI-Learner';
  }

  const sentences = plain
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  let description = sentences.slice(0, 2).join(' ');
  if (!description) {
    description = plain;
  }

  return description.length > 180 ? `${description.slice(0, 177).trim()}...` : description;
}

async function getSharedPageData(token: string) {
  const shareLink = dbShareLinks.getByTokenHash(hashShareToken(token));

  if (!shareLink) {
    return null;
  }

  const page = getDbPages(shareLink.databaseName).getById(shareLink.pageId);

  if (!page) {
    return null;
  }

  return { shareLink, page };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedPageData(token);

  if (!shared) {
    return {
      title: `Shared page not found | ${APP_NAME}`,
      description: 'This shared page is unavailable.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { page } = shared;
  const title = page.title?.trim() || 'Untitled shared page';
  const description = buildDescription(page.content || '');
  const url = new URL(`/share/${token}`, getShareBaseUrl()).toString();
  const imageUrl = new URL(`/share/${token}/opengraph-image`, getShareBaseUrl()).toString();

  return {
    title: `${title} | ${APP_NAME}`,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: APP_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} preview card`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedPageRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await getSharedPageData(token);

  if (!shared) {
    notFound();
  }

  const { shareLink, page } = shared;

  dbShareLinks.touch(shareLink.tokenHash, Date.now());

  return <SharedPageView page={page} />;
}
