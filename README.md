# AI Learning Wiki

A modern, immersive, and highly interactive learning platform where users can explore knowledge through AI-generated wiki pages and intelligent questioning.

## Features

### Dynamic Wiki System
- AI-generated comprehensive wiki pages with rich formatting
- Intelligent "Related Topics" sidebar for exploring connected concepts
- Smart linking and progressive knowledge building
- Context-aware content generation

### AI-Powered Interaction
- Natural language question input on every page
- Context-aware answers based on current topic and learning path
- Smart suggestions for related questions
- Automatic detection of existing vs. new topics to avoid duplication

### User Experience
- Save learning sessions and custom knowledge bases
- Breadcrumb navigation showing learning path history
- Bookmarking favorite wiki pages
- Search across all generated content
- Responsive design optimized for desktop and tablet
- Clean, minimal design with elegant gradients and smooth transitions

### Knowledge Management
- Behind-the-scenes mindmap structure organizing the knowledge graph
- Intelligent content generation guided by knowledge structure
- Persistent local storage for all pages and sessions
- Export-ready wiki pages

## Getting Started

### Prerequisites
- Node.js 18+ installed
- An OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure your OpenAI API:
   - Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo-preview
OPENAI_API_BASE_URL=https://api.openai.com/v1  # default OpenAI endpoint
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start Learning**: Enter any topic in the search box to generate a comprehensive wiki page
2. **Ask Questions**: Use the question input to dive deeper into any concept
3. **Explore Related Topics**: Click on related topics in the sidebar or page content
4. **Bookmark Pages**: Save important pages for quick access later
5. **Track Progress**: View your learning path in the sidebar breadcrumbs
6. **Search**: Find previously generated content using the search function

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom gradients and animations
- **Icons**: Lucide React
- **Markdown**: React Markdown for rich content rendering
- **AI**: OpenAI API (GPT-3.5-turbo by default, supports GPT-4)
- **Storage**: Browser localStorage for persistence

## Architecture

### Components
- `TopicSearch`: Initial topic entry interface
- `WikiPage`: Rich wiki page display with markdown rendering
- `QuestionInput`: Prominent question input for every page
- `Sidebar`: Navigation, bookmarks, and learning path

### Core Systems
- `lib/ai-service.ts`: AI-powered wiki generation and question answering
- `lib/storage.ts`: Local storage management for pages, sessions, and bookmarks
- `lib/types.ts`: TypeScript type definitions
- `app/api/generate/route.ts`: API endpoint for AI content generation

### Data Flow
1. User enters topic or question
2. Check if content already exists in local storage
3. If not, generate new content via AI API
4. Update mindmap structure to maintain knowledge graph
5. Save to local storage and update UI
6. Track in learning session for navigation

## Customization

### API Configuration
Edit `.env.local` to customize:
- Model selection: `OPENAI_MODEL` (default: gpt-3.5-turbo)
  - Options: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview
- API endpoint: `OPENAI_API_BASE_URL` (for Azure OpenAI or other providers)

Edit `app/api/generate/route.ts` for advanced settings:
- Temperature (default: 0.7)
- Max tokens (default: 2000)
- Response format

### Styling
- Modify `app/globals.css` for global styles
- Update Tailwind classes in components for visual changes
- Gradients use blue-indigo-purple palette

### Content Generation
Edit prompts in `lib/ai-service.ts` to customize:
- Wiki page structure and tone
- Related topics suggestions
- Question answering style

## Features in Detail

### Mindmap Knowledge Structure
- Invisible graph structure organizing all topics
- Parent-child relationships between pages
- Depth tracking for knowledge hierarchy
- Smart linking based on context

### Learning Sessions
- Automatic session creation on first topic
- Breadcrumb navigation (last 10 pages)
- Page count tracking
- Session persistence across browser sessions

### Smart Deduplication
- Exact match detection for topics
- Similar question detection
- Reuse existing content when possible
- Consistent page IDs based on title + timestamp

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Browser Support

Modern browsers with:
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Local Storage API
- Fetch API

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
