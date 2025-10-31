# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered learning platform that generates comprehensive wiki pages on demand and enables interactive learning through natural language questions. The system maintains an invisible knowledge graph (mindmap) to organize topics and guide content generation.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, OpenAI API, SQLite (better-sqlite3)

## Development Commands

### Setup
```bash
npm install
# Configure .env.local with OPENAI_API_KEY before running
```

### Development
```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run test-openai      # Test OpenAI API connection
```

### Testing OpenAI Connection
Use `npm run test-openai` to verify API configuration before running the application.

## Architecture

### Core Data Flow

1. **Topic Search Flow**: User enters topic → Check database for existing page → If not found, call `generateWikiPage()` → API call to `/api/generate` → OpenAI generates JSON content → Save to SQLite database via `/api/pages` → Update mindmap structure → Display WikiPage

2. **Question Flow**: User asks question → Check for similar existing page → If not found, call `answerQuestion()` with current page context → Generate answer as new page → Link to parent in mindmap → Update session breadcrumbs → Display answer

3. **Selection-Based Generation Flow**: User selects text on wiki page → SelectionPopup appears → User clicks "Generate Page from Selection" → Extract surrounding context (paragraph/section) → Call `generateFromSelection()` with selected text + context → AI generates contextual page → Link to parent in mindmap → Navigate to new page

4. **Storage Architecture**: All data persists in server-side SQLite database (`data/wiki.db`):
   - `wiki_pages` table: All generated WikiPage objects
   - `learning_sessions` table: User session tracking with breadcrumbs
   - `bookmarks` table: Saved page references
   - `knowledge_nodes` table: Graph structure of topic relationships
   - `app_state` table: Application state (current session ID)

### Key Files

- **`app/page.tsx`** (245 lines): Main application component. Manages all state (currentPage, session, bookmarks) and orchestrates child components. Handlers: `handleTopicSearch`, `handleAskQuestion`, `handleBookmark`, `handleNavigateToPage`, session management.

- **`app/api/generate/route.ts`**: OpenAI API integration endpoint. Accepts POST with messages array, returns JSON-formatted content. Handles model selection (GPT-5 vs others), error handling, and response validation.

- **`app/api/pages/route.ts`**: Wiki pages CRUD endpoint. GET (with optional id or query params), POST (save page), DELETE (duplicates or all).

- **`app/api/sessions/route.ts`**: Learning sessions endpoint. GET (with optional id or current flag), POST (save session), DELETE (all sessions).

- **`app/api/bookmarks/route.ts`**: Bookmarks endpoint. GET (all), POST (add), DELETE (by pageId or all).

- **`app/api/mindmap/route.ts`**: Knowledge graph endpoint. GET (all nodes), POST (save node), DELETE (all nodes).

- **`lib/ai-service.ts`**: Core AI functions:
  - `generateWikiPage()`: Creates comprehensive wiki from topic
  - `answerQuestion()`: Generates contextualized answer pages
  - `generateFromSelection()`: Creates contextual pages from highlighted text with surrounding context
  - `generateMindmapNode()`: Creates knowledge graph nodes
  - Contains system prompts defining AI behavior

- **`lib/storage.ts`**: API client layer. Provides async CRUD operations for pages, sessions, bookmarks, mindmap by making fetch calls to API routes. All methods return Promises.

- **`lib/db.ts`**: SQLite database layer. Direct database access using better-sqlite3. Exports `dbPages`, `dbSessions`, `dbBookmarks`, `dbMindmap` objects with synchronous CRUD methods. Only used by API routes.

- **`lib/types.ts`**: TypeScript interfaces defining WikiPage, KnowledgeNode, LearningSession, Bookmark, ResearchCollection.

### Component Structure

```
app/page.tsx (root state)
├─ TopicSearch.tsx        # Initial topic entry interface
├─ QuestionInput.tsx      # Sticky question input on every page
├─ WikiPage.tsx           # Markdown rendering, bookmarks, related topics, text selection
│  └─ SelectionPopup.tsx  # Popup for generating pages from selected text
└─ Sidebar.tsx            # Breadcrumbs, bookmarks, search, related topics
```

Props flow down from page.tsx with callbacks for state updates. No external state management library.

**Text Selection Feature**: WikiPage detects text selection via `onMouseUp` event, extracts surrounding context from the DOM (paragraph/section), and shows SelectionPopup. The popup allows users to generate new pages based on the selected text with full context awareness.

## AI Integration

### OpenAI Configuration

Environment variables in `.env.local`:
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5                              # Default: gpt-5
OPENAI_API_BASE_URL=https://api.openai.com/v1  # Default OpenAI endpoint
```

### Model Behavior

The API route (`app/api/generate/route.ts:18-29`) has special handling:
- **GPT-5 models**: Uses `max_completion_tokens` parameter, no temperature setting
- **Other models**: Uses `temperature: 0.7` and `max_completion_tokens: 2000`
- **Response format**: Always `{ type: 'json_object' }` for structured output

### Prompt Engineering

All generation functions in `lib/ai-service.ts` use system + user prompt pattern:
- `generateWikiPage()`: Creates comprehensive wiki pages from topics
- `answerQuestion()`: Generates answer pages based on questions
- `generateFromSelection()`: Creates context-aware pages from highlighted text + surrounding content

Each function:
- System prompt defines content creator persona and JSON response structure
- User prompt provides topic/question/selection and context
- Expected JSON: `{ title, content, relatedTopics[], suggestedQuestions[] }`

When modifying AI behavior, update system prompts in `lib/ai-service.ts`.

## Important Patterns

### Deduplication Strategy

The system prevents duplicate pages through:
1. **ID Generation**: `generateId(text)` creates slugified text + timestamp (lib/ai-service.ts:147-152)
2. **Duplicate Detection**: `storage.removeDuplicatePages()` removes pages with identical normalized titles, keeping most recent
3. **Storage Check**: Always check `storage.getPage()` before generating new content

### Knowledge Graph Management

Mindmap nodes track parent-child relationships:
- Each WikiPage can have `parentId` linking to origin topic
- `KnowledgeNode` stores id, title, children[], parent?, depth
- Depth calculation: parent depth + 1 (starts at 0 for root topics)
- Use `generateMindmapNode(page, parentNode?)` to create graph nodes

### Session Tracking

Learning sessions automatically:
- Created on first topic entry with name from initial topic
- Track all page IDs visited
- Maintain breadcrumb array (last 10 pages with id + title)
- Update current page ID on navigation
- Persist to localStorage on every update

## Code Style

- TypeScript strict mode enabled
- Use `'use client'` directive for client components (storage.ts, all components)
- Prefer explicit return types for functions
- Props interfaces defined inline or imported from types.ts
- Tailwind classes for all styling (no CSS modules)
- Gradient palette: blue-indigo-purple (e.g., `from-blue-600 via-indigo-600 to-purple-600`)

## Common Tasks

### Adding New API Parameters

1. Update `app/api/generate/route.ts` requestPayload
2. Consider model-specific behavior (GPT-5 vs others check)
3. Test with both model types

### Extending WikiPage Data

1. Add interface property to `lib/types.ts` WikiPage
2. Update `generateWikiPage()` and `answerQuestion()` return objects
3. Modify system prompts to include new data in JSON response
4. Update WikiPage.tsx rendering if needed

### Adding Storage Types

1. Define interface in `lib/types.ts`
2. Add storage key to STORAGE_KEYS in `lib/storage.ts`
3. Implement get/save functions following existing patterns
4. Export from storage object

### Modifying Content Generation

System prompts define AI behavior (lib/ai-service.ts):
- Lines 16-29: Wiki page generation persona
- Lines 80-92: Question answering persona
- Update JSON structure requirements if changing expected output
- Test fallback content paths for error handling

## Known Quirks

- **Server-Side Storage**: Data persists in SQLite database at `data/wiki.db`. Database file is gitignored.
- **Async Storage**: All storage methods in `lib/storage.ts` are now async and return Promises. Components must use `await` or `.then()`.
- **Client-Side Only**: All components except API routes must use `'use client'` directive.
- **ID Uniqueness**: Page IDs include timestamp to ensure uniqueness even for identical topics.
- **Duplicate Cleanup**: `removeDuplicatePages()` keeps most recent page based on `created_at` timestamp.
- **GPT-5 Handling**: Special parameter handling for GPT-5 models (no temperature, uses max_completion_tokens instead of max_tokens).
- **Database Initialization**: Database and tables are automatically created on first access via `getDatabase()` in `lib/db.ts`.

## Environment Setup

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Model name (optional, defaults to 'gpt-5')
- `OPENAI_API_BASE_URL`: API endpoint (optional, defaults to OpenAI)

The `.env.local` file is gitignored and must be created manually.
