export interface PageSelectionSource {
  pageId: string;
  pageTitle: string;
  selectedText: string;
  contextExcerpt?: string;
}

export interface PageSelectionBacklink {
  targetPageId: string;
  targetPageTitle: string;
  selectedText: string;
  contextExcerpt?: string;
  createdAt: number;
}

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
  sourceSelection?: PageSelectionSource;
  selectionBacklinks?: PageSelectionBacklink[];
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

export interface PageView {
  pageId: string;
  firstViewedAt: number;
  lastViewedAt: number;
  viewCount: number;
}

export interface ResearchCollection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  pages: string[];
  rootPageId: string;
  tags: string[];
  isPublic: boolean;
  shareCode?: string;
  thumbnail?: string;
}

export type GenerationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type GenerationJobType = 'wiki_page' | 'question' | 'selection' | 'notebooklm_report';

export interface NotebookLmSourceInput {
  kind: 'url' | 'text';
  value: string;
  title?: string;
}

export interface GenerationJobInput {
  topic?: string;
  question?: string;
  currentPageContent?: string;
  selectedText?: string;
  context?: string;
  parentId?: string;
  notebooklmPrompt?: string;
  notebooklmNotebookName?: string;
  notebooklmSources?: NotebookLmSourceInput[];
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

export interface AuthenticatedUser {
  provider: 'agentkea';
  authUserId: string;
  email?: string | null;
  displayName?: string | null;
  databaseKey: string;
}

export interface AuthSession {
  id: string;
  user: AuthenticatedUser;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export interface ShareLinkRecord {
  tokenHash: string;
  pageId: string;
  databaseName: string;
  createdAt: number;
  createdByUserId?: string;
  lastAccessedAt?: number;
}
