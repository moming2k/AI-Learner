import { WikiPage, KnowledgeNode } from './types';

interface GenerateWikiParams {
  topic: string;
  context?: string;
  relatedPages?: WikiPage[];
  parentId?: string;
  existingPageId?: string;
}

// Simple in-memory cache for recent generations (helps with duplicate requests)
const generationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type: string, key: string): string {
  return `${type}:${key.toLowerCase().trim()}`;
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
    generationCache.delete(oldestKey);
  }
}

export async function generateWikiPage(params: GenerateWikiParams): Promise<WikiPage> {
  const { topic, context, relatedPages, parentId, existingPageId } = params;

  const resolvedId = existingPageId ?? generateId(topic);

  // Check cache first
  const cacheKey = getCacheKey('wiki', `${topic}|${context || ''}`);
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

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false // Can be set to true for streaming in future enhancement
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate wiki page');
    }

    const data = await response.json();

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
  selectedText: string,
  context: string,
  currentPage: WikiPage
): Promise<WikiPage> {
  // Check cache first
  const cacheKey = getCacheKey('selection', `${selectedText}:${currentPage.id}`);
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

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate from selection');
    }

    const data = await response.json();

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

export async function answerQuestion(question: string, currentPage: WikiPage): Promise<WikiPage> {
  // Check cache first
  const cacheKey = getCacheKey('question', `${question}:${currentPage.id}`);
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

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to answer question');
    }

    const data = await response.json();

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
