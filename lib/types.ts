export interface WikiPage {
  id: string;
  title: string;
  content: string;
  relatedTopics: string[];
  suggestedQuestions: string[];
  createdAt: number;
  parentId?: string;
  isPlaceholder?: boolean;
  mindmapPosition?: { x: number; y: number };
}

export interface KnowledgeNode {
  id: string;
  title: string;
  children: string[];
  parent?: string;
  depth: number;
}

export interface LearningSession {
  id: string;
  name: string;
  startedAt: number;
  pages: string[];
  currentPageId: string;
  breadcrumbs: Array<{ id: string; title: string }>;
}

export interface Bookmark {
  pageId: string;
  title: string;
  timestamp: number;
}

export interface ResearchCollection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  pages: string[]; // Array of page IDs
  rootPageId: string; // The starting page of the collection
  tags: string[];
  isPublic: boolean;
  shareCode?: string; // For sharing collections
  thumbnail?: string; // Preview image or emoji
}

export type GenerationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type GenerationJobType = 'wiki_page' | 'question' | 'selection';

export interface GenerationJobInput {
  topic?: string;
  question?: string;
  currentPageContent?: string;
  selectedText?: string;
  context?: string;
  parentId?: string;
}

export interface GenerationJob {
  id: string;
  status: GenerationJobStatus;
  type: GenerationJobType;
  input: GenerationJobInput;
  output?: WikiPage;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
