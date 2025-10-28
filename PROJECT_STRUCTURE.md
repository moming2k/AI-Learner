# Project Structure - AI Learning Wiki

## Directory Overview

```
ai-learning-wiki/
├── app/                        # Next.js App Router
│   ├── api/                   # API Routes
│   │   └── generate/          # AI content generation endpoint
│   │       └── route.ts       # OpenAI API integration
│   ├── layout.tsx             # Root layout with fonts & metadata
│   ├── page.tsx               # Main application page
│   ├── globals.css            # Global styles & custom CSS
│   └── favicon.ico            # App icon
│
├── components/                 # React Components
│   ├── TopicSearch.tsx        # Initial topic entry interface
│   ├── WikiPage.tsx           # Wiki page display with markdown
│   ├── QuestionInput.tsx      # Question input component
│   └── Sidebar.tsx            # Navigation, bookmarks, history
│
├── lib/                        # Core Business Logic
│   ├── types.ts               # TypeScript type definitions
│   ├── storage.ts             # localStorage management
│   └── ai-service.ts          # AI generation & mindmap logic
│
├── public/                     # Static assets
│   └── *.svg                  # SVG icons
│
├── .env.local                 # Environment variables (API keys)
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── README.md                  # Project overview
├── SETUP_GUIDE.md             # Detailed setup instructions
└── PROJECT_STRUCTURE.md       # This file
```

## Core Files Explained

### Application Entry Point
- **`app/page.tsx`** (245 lines)
  - Main application component
  - State management for current page, session, bookmarks
  - Handlers for topic search, questions, bookmarking
  - Orchestrates all child components
  - Manages learning session lifecycle

### Components

#### `components/TopicSearch.tsx`
- Search-engine style topic input
- Example topic buttons
- Loading state handling
- Clean, prominent design

#### `components/WikiPage.tsx`
- Rich markdown content rendering
- Bookmark toggle button
- Related topics navigation
- Suggested questions display
- Gradient headers and styling

#### `components/QuestionInput.tsx`
- Sticky positioned question input
- Sparkle icon for AI interaction
- Loading states with spinner
- Gradient border effects

#### `components/Sidebar.tsx`
- Responsive sidebar (sticky on desktop, toggle on mobile)
- Search functionality
- Breadcrumb navigation (learning path)
- Bookmarks list
- Related topics from current page
- Mobile-friendly toggle button

### Core Library

#### `lib/types.ts`
Defines all TypeScript interfaces:
```typescript
- WikiPage          // Individual wiki page data
- KnowledgeNode     // Mindmap node structure
- LearningSession   // User session tracking
- Bookmark          // Saved page references
```

#### `lib/storage.ts`
Local storage management:
- `getPages()` / `savePage()` - Wiki page CRUD
- `getSessions()` / `saveSession()` - Session management
- `getBookmarks()` / `addBookmark()` - Bookmark operations
- `getMindmap()` / `saveMindmapNode()` - Knowledge graph
- `searchPages()` - Full-text search
- `clearAll()` - Reset functionality

#### `lib/ai-service.ts`
AI content generation:
- `generateWikiPage()` - Create new wiki from topic
- `answerQuestion()` - Generate answer page from question
- `generateMindmapNode()` - Create knowledge graph node
- System prompts for AI behavior
- Fallback content for offline mode

### API Routes

#### `app/api/generate/route.ts`
- POST endpoint for AI generation
- OpenAI API integration
- Error handling and validation
- JSON response formatting
- Environment variable configuration

### Configuration Files

#### `next.config.ts`
- Next.js framework configuration
- Turbopack settings (optional)
- Build optimizations

#### `tailwind.config.ts`
- Tailwind CSS customization
- Custom color palette (implicit via classes)
- Plugin configurations

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases (`@/*`)
- Module resolution settings

#### `.env.local`
```env
OPENAI_API_KEY=your_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## Data Flow

### 1. Topic Search Flow
```
User enters topic
    ↓
TopicSearch component
    ↓
handleTopicSearch in page.tsx
    ↓
Check storage for existing page
    ↓
If not found: generateWikiPage()
    ↓
API call to /api/generate
    ↓
OpenAI generates content
    ↓
Save to localStorage
    ↓
Update mindmap structure
    ↓
Create/update session
    ↓
Display WikiPage component
```

### 2. Question Flow
```
User asks question
    ↓
QuestionInput component
    ↓
handleAskQuestion in page.tsx
    ↓
Check storage for similar page
    ↓
If not found: answerQuestion()
    ↓
API call with context
    ↓
Generate answer as new page
    ↓
Link to parent in mindmap
    ↓
Update session breadcrumbs
    ↓
Display answer page
```

### 3. Storage Structure

#### localStorage Keys
```javascript
// All wiki pages ever generated
wiki_pages: WikiPage[]

// All learning sessions
learning_sessions: LearningSession[]

// Bookmarked pages
bookmarks: Bookmark[]

// Knowledge graph structure
knowledge_mindmap: KnowledgeNode[]

// Current active session ID
current_session: string
```

## Component Architecture

### State Management
- **React useState**: Component-level state
- **localStorage**: Persistent data layer
- **No external state library needed** - Simple and effective

### Props Flow
```
page.tsx (root state)
    ↓
    ├→ TopicSearch (onSearch callback)
    ├→ QuestionInput (onAsk callback)
    ├→ WikiPage (page data, onNavigate, onBookmark)
    └→ Sidebar (session, bookmarks, navigation callbacks)
```

### Event Handlers
- `handleTopicSearch` - New topic exploration
- `handleAskQuestion` - Question answering
- `handleBookmark` - Toggle bookmark
- `handleNavigateToPage` - Navigate by page ID
- `createNewSession` - Initialize learning session
- `updateSession` - Track learning progress

## Styling Approach

### Design System
- **Colors**: Blue-Indigo-Purple gradient palette
- **Spacing**: Tailwind's default scale
- **Typography**: Geist Sans & Geist Mono fonts
- **Shadows**: Custom shadow-xl for depth
- **Borders**: Rounded corners (rounded-xl, rounded-2xl)
- **Transitions**: duration-200, duration-300 for smoothness

### Responsive Design
- Mobile-first approach
- Sidebar toggles on mobile
- Flexible grid layouts
- Touch-friendly hit areas

### Animations
- Hover effects on buttons
- Scale transforms (hover:scale-105)
- Gradient transitions
- Spinner loading states
- Smooth scrolling

## Adding New Features

### New Component
1. Create in `components/YourComponent.tsx`
2. Import types from `lib/types.ts`
3. Add props interface
4. Integrate into `app/page.tsx`

### New Storage Type
1. Add interface to `lib/types.ts`
2. Add storage key to `lib/storage.ts`
3. Implement CRUD functions
4. Use in components

### New AI Capability
1. Add function to `lib/ai-service.ts`
2. Create API endpoint if needed
3. Update prompts for new behavior
4. Integrate into UI flow

## Performance Considerations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component ready
- **API Caching**: localStorage prevents redundant calls
- **Lazy Loading**: Components loaded on demand
- **Static Generation**: Home page pre-rendered

## Security Notes

- API key stored in `.env.local` (never committed)
- Client-side storage only (no user data on server)
- Input validation on API routes
- CORS handled by Next.js
- XSS protection via React

## Testing Approach

### Manual Testing Checklist
- [ ] Topic search generates page
- [ ] Question creates answer page
- [ ] Bookmarks save and load
- [ ] Session persists across refresh
- [ ] Search finds existing pages
- [ ] Related topics navigation works
- [ ] Mobile sidebar toggles
- [ ] API errors handled gracefully

### Future Automated Testing
- Unit tests for storage functions
- Component tests with React Testing Library
- E2E tests with Playwright
- API route tests

## Deployment Checklist

- [ ] Set OPENAI_API_KEY in production env
- [ ] Test build: `npm run build`
- [ ] Check bundle size
- [ ] Verify API routes work
- [ ] Test on mobile devices
- [ ] Check console for errors
- [ ] Validate TypeScript: `npm run build`

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor API costs
- Clear old localStorage data
- Check browser compatibility
- Review AI prompt effectiveness

### Known Limitations
- localStorage has ~5-10MB limit
- No server-side persistence
- Single-user (no collaboration)
- No offline AI generation
- English-focused prompts

## Extension Ideas

Future enhancements could include:
- Export to PDF/Markdown
- Visual mindmap display
- Image generation for topics
- Voice input for questions
- Multi-language support
- Cloud sync option
- Collaboration features
- Citation management
- Quiz generation
- Learning analytics

---

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4
