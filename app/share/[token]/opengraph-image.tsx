import { ImageResponse } from 'next/og';
import { dbShareLinks, getDbPages } from '@/lib/db';
import { hashShareToken } from '@/lib/share-links';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const APP_NAME = 'AI-Learner';

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

  return description.length > 220 ? `${description.slice(0, 217).trim()}...` : description;
}

function clampTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Shared page';
  }

  return trimmed.length > 90 ? `${trimmed.slice(0, 87).trim()}...` : trimmed;
}

function getSharedPageData(token: string) {
  const shareLink = dbShareLinks.getByTokenHash(hashShareToken(token));

  if (!shareLink) {
    return null;
  }

  const page = getDbPages(shareLink.databaseName).getById(shareLink.pageId);

  if (!page) {
    return null;
  }

  return { page };
}

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = getSharedPageData(token);

  const title = clampTitle(shared?.page.title || 'Shared page unavailable');
  const description = shared ? buildDescription(shared.page.content || '') : 'This shared page is unavailable.';
  const kicker = shared ? 'Shared research note' : 'Shared page unavailable';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 48%, #1e293b 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(59,130,246,0.32) 0%, rgba(59,130,246,0.08) 42%, transparent 72%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0.06) 45%, transparent 74%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '52px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 20px',
                borderRadius: 999,
                background: 'rgba(15, 23, 42, 0.48)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                backdropFilter: 'blur(8px)',
                fontSize: 26,
                fontWeight: 700,
                color: '#dbeafe',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  boxShadow: '0 0 22px rgba(96,165,250,0.55)',
                }}
              />
              <div style={{ display: 'flex' }}>{APP_NAME}</div>
            </div>

            <div
              style={{
                display: 'flex',
                padding: '12px 18px',
                borderRadius: 999,
                background: 'rgba(30, 41, 59, 0.72)',
                color: '#cbd5e1',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              notes.agentkea.com
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '90%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: 999,
                background: 'rgba(96, 165, 250, 0.14)',
                border: '1px solid rgba(96, 165, 250, 0.26)',
                color: '#bfdbfe',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              {kicker}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 68,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                textWrap: 'balance',
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: 'flex',
                maxWidth: '86%',
                fontSize: 31,
                lineHeight: 1.32,
                color: '#cbd5e1',
                textWrap: 'pretty',
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#94a3b8',
                fontSize: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: '#22c55e',
                }}
              />
              <div style={{ display: 'flex' }}>Private share preview</div>
            </div>
            <div
              style={{
                display: 'flex',
                color: '#64748b',
                fontSize: 22,
              }}
            >
              Generated by AI-Learner
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
