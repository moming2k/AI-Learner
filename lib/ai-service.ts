import { WikiPage, KnowledgeNode } from './types';

interface GenerateWikiParams {
  topic: string;
  context?: string;
  relatedPages?: WikiPage[];
  parentId?: string;
  existingPageId?: string;
  onProgress?: (content: string) => void;
}

interface GenerateQuestionParams {
  question: string;
  currentPage: WikiPage;
  onProgress?: (content: string) => void;
}

interface GenerateSelectionParams {
  selectedText: string;
  context: string;
  currentPage: WikiPage;
  onProgress?: (content: string) => void;
}

// Simple in-memory cache for recent generations (helps with duplicate requests)
const generationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_DELIMITER = ':';

function getCacheKey(type: string, key: string): string {
  return `${type}${CACHE_KEY_DELIMITER}${key.toLowerCase().trim()}`;
}

function getFromCache(cacheKey: string): any | null {
  const cached = generationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  generationCache.delete(cacheKey);
  return null;
}

function setCache(cacheKey: string, data: any): void {
  generationCache.set(cacheKey, { data, timestamp: Date.now() });
  // Clean up old cache entries (keep max 50 items)
  if (generationCache.size > 50) {
    const oldestKey = generationCache.keys().next().value;
    if (oldestKey) {
      generationCache.delete(oldestKey);
    }
  }
}

async function handleStreamResponse(
  response: Response,
  onProgress?: (content: string) => void
): Promise<any> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = '';

  if (!reader) {
    throw new Error('No response body');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedContent = parsed.content;
              if (onProgress) {
                onProgress(accumulatedContent);
              }
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    }

    // Parse the final accumulated content as JSON
    return JSON.parse(accumulatedContent);
  } catch (error) {
    console.error('Error processing stream:', error);
    throw error;
  }
}

export async function generateWikiPage(params: GenerateWikiParams): Promise<WikiPage> {
  const { topic, context, relatedPages, parentId, existingPageId, onProgress } = params;

  const resolvedId = existingPageId ?? generateId(topic);
  const cacheKey = getCacheKey('wiki', `${topic}${CACHE_KEY_DELIMITER}${context || ''}`);

  // Skip cache when streaming for real-time updates
  if (!onProgress) {
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        id: resolvedId,
        ...cached,
        createdAt: Date.now(),
        parentId,
        isPlaceholder: false
      };
    }
  }

  // Optimized, more concise system prompt
  const systemPrompt = `You are an expert educator. Create a comprehensive wiki page as JSON:
{
  "title": "Topic Title",
  "content": "Markdown content with ## headings, **bold**, lists, examples",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

  const userPrompt = context
    ? `Wiki page: "${topic}"\nContext: ${context}\nRelated: ${relatedPages?.map(p => p.title).join(', ') || 'None'}`
    : `Create a comprehensive wiki page about "${topic}" with overview, key concepts, details, and applications.`;

  const useStreaming = !!onProgress;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: useStreaming
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate wiki page');
    }

    const data = useStreaming
      ? await handleStreamResponse(response, onProgress)
      : await response.json();

    // Cache the result
    setCache(cacheKey, data);

    const page: WikiPage = {
      id: resolvedId,
      ...data,
      createdAt: Date.now(),
      parentId,
      isPlaceholder: false
    };

    return page;
  } catch (error) {
    console.error('Error generating wiki page:', error);

    // Fallback content
    return {
      id: resolvedId,
      title: topic,
      content: `# ${topic}\n\nThis is a placeholder page. The AI service is currently unavailable.\n\nPlease configure your OpenAI API key in the .env.local file.`,
      relatedTopics: [],
      suggestedQuestions: [],
      createdAt: Date.now(),
      parentId,
      isPlaceholder: true
    };
  }
}

export async function generateFromSelection(
  params: GenerateSelectionParams
): Promise<WikiPage> {
  const { selectedText, context, currentPage, onProgress } = params;

  const cacheKey = getCacheKey('selection', `${selectedText}${CACHE_KEY_DELIMITER}${currentPage.id}`);

  // Skip cache when streaming for real-time updates
  if (!onProgress) {
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        id: generateId(selectedText),
        ...cached,
        createdAt: Date.now(),
        parentId: currentPage.id,
        isPlaceholder: false
      };
    }
  }

  // Optimized, concise system prompt
  const systemPrompt = `Expert educator explaining highlighted text. Return JSON:
{
  "title": "Clear concept title",
  "content": "Markdown explanation with examples",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

  const userPrompt = `Page: ${currentPage.title}
Selected: "${selectedText}"
Context: "${context}"

Explain "${selectedText}" as it relates to "${currentPage.title}".`;

  const useStreaming = !!onProgress;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: useStreaming
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate from selection');
    }

    const data = useStreaming
      ? await handleStreamResponse(response, onProgress)
      : await response.json();

    // Cache the result
    setCache(cacheKey, data);

    return {
      id: generateId(selectedText),
      ...data,
      createdAt: Date.now(),
      parentId: currentPage.id,
      isPlaceholder: false
    };
  } catch (error) {
    console.error('Error generating from selection:', error);

    return {
      id: generateId(selectedText),
      title: selectedText,
      content: `# ${selectedText}\n\nUnable to generate content. Please check your API configuration.`,
      relatedTopics: [],
      suggestedQuestions: [],
      createdAt: Date.now(),
      parentId: currentPage.id,
      isPlaceholder: true
    };
  }
}

export async function answerQuestion(
  params: GenerateQuestionParams
): Promise<WikiPage> {
  const { question, currentPage, onProgress } = params;

  const cacheKey = getCacheKey('question', `${question}${CACHE_KEY_DELIMITER}${currentPage.id}`);

  // Skip cache when streaming for real-time updates
  if (!onProgress) {
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        id: generateId(question),
        ...cached,
        createdAt: Date.now(),
        parentId: currentPage.id,
        isPlaceholder: false
      };
    }
  }

  // Optimized, concise system prompt
  const systemPrompt = `Expert educator answering questions. Return JSON:
{
  "title": "Concise answer title",
  "content": "Markdown answer with examples",
  "relatedTopics": ["Topic 1", "Topic 2"],
  "suggestedQuestions": ["Question 1?", "Question 2?"]
}`;

  const userPrompt = `Topic: ${currentPage.title}
Question: ${question}

Answer comprehensively, building on the current topic.`;

  const useStreaming = !!onProgress;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: useStreaming
      })
    });

    if (!response.ok) {
      throw new Error('Failed to answer question');
    }

    const data = useStreaming
      ? await handleStreamResponse(response, onProgress)
      : await response.json();

    // Cache the result
    setCache(cacheKey, data);

    return {
      id: generateId(question),
      ...data,
      createdAt: Date.now(),
      parentId: currentPage.id,
      isPlaceholder: false
    };
  } catch (error) {
    console.error('Error answering question:', error);

    return {
      id: generateId(question),
      title: question,
      content: `# ${question}\n\nUnable to generate answer. Please check your API configuration.`,
      relatedTopics: [],
      suggestedQuestions: [],
      createdAt: Date.now(),
      parentId: currentPage.id,
      isPlaceholder: true
    };
  }
}

export function generateMindmapNode(page: WikiPage, parentNode?: KnowledgeNode): KnowledgeNode {
  return {
    id: page.id,
    title: page.title,
    children: [],
    parent: parentNode?.id,
    depth: parentNode ? parentNode.depth + 1 : 0
  };
}

function generateId(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
    '-' + Date.now().toString(36);
}
