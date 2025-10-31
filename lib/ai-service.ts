import { WikiPage, KnowledgeNode } from './types';

interface GenerateWikiParams {
  topic: string;
  context?: string;
  relatedPages?: WikiPage[];
  parentId?: string;
  existingPageId?: string;
}

export async function generateWikiPage(params: GenerateWikiParams): Promise<WikiPage> {
  const { topic, context, relatedPages, parentId, existingPageId } = params;

  const resolvedId = existingPageId ?? generateId(topic);

  const systemPrompt = `You are an expert educational content creator. Generate comprehensive, well-structured wiki content that is:
- Accurate and informative
- Well-organized with clear sections
- Written in an engaging, accessible style
- Rich with examples and explanations
- Connected to related concepts

Format your response as JSON with this structure:
{
  "title": "Topic Title",
  "content": "Rich markdown content with ## headings, **bold**, *italic*, lists, etc.",
  "relatedTopics": ["Related Topic 1", "Related Topic 2", "Related Topic 3"],
  "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

  const userPrompt = context
    ? `Generate a wiki page about "${topic}" in the context of: ${context}\n\nRelated existing pages: ${relatedPages?.map(p => p.title).join(', ') || 'None'}`
    : `Generate a comprehensive wiki page about "${topic}". Include an overview, key concepts, important details, and practical applications.`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate wiki page');
    }

    const data = await response.json();

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
  const systemPrompt = `You are an expert educator creating detailed content based on highlighted text. Create a comprehensive wiki page that:
- Explains the selected term/concept in depth
- Uses the provided context to understand the specific meaning and usage
- Provides relevant examples and explanations
- Connects to related concepts
- Is tailored to the context of where the text was selected from

Format as JSON:
{
  "title": "Clear, descriptive title for the concept",
  "content": "Comprehensive markdown content explaining the selected text with context-aware details",
  "relatedTopics": ["Related Topic 1", "Related Topic 2", "Related Topic 3"],
  "suggestedQuestions": ["Follow-up Question 1?", "Follow-up Question 2?", "Follow-up Question 3?"]
}`;

  const userPrompt = `Current page: ${currentPage.title}

Selected text: "${selectedText}"

Context from the page where this was selected:
"${context}"

Create a detailed wiki page about "${selectedText}" that takes into account the specific context and usage shown above. The explanation should be relevant to how this term/concept appears in the context of "${currentPage.title}".`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate from selection');
    }

    const data = await response.json();

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
  const systemPrompt = `You are an expert educator answering a student's question. Create a focused wiki page that:
- Directly answers the question
- Provides context from the current topic
- Includes relevant examples
- Links to related concepts

Format as JSON:
{
  "title": "Concise Answer Title",
  "content": "Detailed markdown content answering the question",
  "relatedTopics": ["Related Topic 1", "Related Topic 2"],
  "suggestedQuestions": ["Follow-up Question 1?", "Follow-up Question 2?"]
}`;

  const userPrompt = `Current topic: ${currentPage.title}\n\nQuestion: ${question}\n\nProvide a comprehensive answer that builds on the current topic.`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to answer question');
    }

    const data = await response.json();

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
