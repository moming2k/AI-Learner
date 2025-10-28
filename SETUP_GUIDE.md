# Setup Guide - AI Learning Wiki

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure OpenAI API

Create or edit `.env.local` file in the project root:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Optional: Choose your model (default: gpt-3.5-turbo)
OPENAI_MODEL=gpt-3.5-turbo

# Optional: API endpoint (default: OpenAI)
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

**Important Notes:**
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Model Options:**
  - `gpt-3.5-turbo` - Fast and cost-effective (recommended for testing)
  - `gpt-4` - Most capable, higher cost
  - `gpt-4-turbo-preview` - Latest GPT-4 with better performance
- For Azure OpenAI, update the `OPENAI_API_BASE_URL` to your Azure endpoint

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Using the Platform

### First-Time Experience

1. **Enter a Topic**: Type any subject you want to learn about
   - Examples: "Quantum Computing", "Renaissance Art", "Climate Change"
   - Press Enter or click the search button

2. **Read the Generated Wiki**: AI creates a comprehensive page with:
   - Structured content with headings and formatting
   - Related topics you can explore
   - Suggested questions to deepen understanding

3. **Ask Questions**: Use the prominent question input at the top
   - Ask anything related to the current topic
   - AI generates a new page answering your question
   - Your learning path is tracked in the sidebar

4. **Navigate Your Knowledge**:
   - **Breadcrumbs**: See your learning journey in the sidebar
   - **Bookmarks**: Save important pages for later
   - **Related Topics**: Click to explore connected concepts
   - **Search**: Find previously generated content

## Features Walkthrough

### Learning Sessions
- Automatically created when you start exploring
- Tracks all pages you've visited
- Shows your learning path (last 10 pages)
- Persists across browser sessions

### Bookmarking
- Click the bookmark icon on any page
- Access all bookmarks from the sidebar
- Click to navigate back to bookmarked pages
- Remove bookmarks by clicking again

### Search
- Enter keywords in the sidebar search box
- Searches across all generated wiki pages
- Finds matches in titles and content
- Generates new page if no match found

### Knowledge Graph
- Behind the scenes, a mindmap tracks all topics
- Parent-child relationships between pages
- Smart linking based on context
- Prevents duplicate pages for same topics

## Customization

### Change AI Model
Edit `.env.local`:
```env
OPENAI_MODEL=gpt-4  # Options: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview
```

Or for one-time testing, edit `app/api/generate/route.ts`:
```typescript
model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
```

### Adjust AI Creativity
Edit `app/api/generate/route.ts`:
```typescript
temperature: 0.7,  // Range: 0.0 (focused) to 1.0 (creative)
```

### Modify Content Style
Edit `lib/ai-service.ts` system prompts to change:
- Writing style (formal, casual, technical)
- Content depth and detail level
- Number of related topics suggested
- Types of questions suggested

### Visual Customization
- **Colors**: Update gradient classes in components
  - `from-blue-500 to-indigo-600` (main gradients)
  - Change to any Tailwind color combination
- **Fonts**: Already using optimized Geist fonts
- **Spacing**: Adjust padding/margin in component styles

## Troubleshooting

### "Failed to generate wiki page"
- Check your `.env.local` file exists and has valid API key
- Verify API key has credits available
- Check console for detailed error messages

### "OpenAI API key not configured"
- Ensure `.env.local` is in the project root
- Restart the development server after adding `.env.local`
- Check file name is exactly `.env.local` (not `.env`)

### Pages not persisting
- Check browser localStorage is enabled
- Try a different browser if issues persist
- Clear localStorage and restart session if needed

### TypeScript Errors
```bash
# Clear build cache
rm -rf .next
npm run dev
```

## Data Management

### Local Storage Keys
- `wiki_pages`: All generated wiki pages
- `learning_sessions`: Your learning sessions
- `bookmarks`: Bookmarked pages
- `knowledge_mindmap`: Topic relationships
- `current_session`: Active session ID

### Clear All Data
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Export Your Data
```javascript
// In browser console
const pages = localStorage.getItem('wiki_pages')
console.log(JSON.parse(pages))
// Copy and save to file
```

## Performance Tips

1. **First Load**: May take 5-10 seconds to generate initial page
2. **Subsequent Queries**: Cached pages load instantly
3. **API Costs**: Using gpt-4o-mini keeps costs very low
4. **Storage**: Hundreds of pages can be stored in localStorage

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
Ensure your production environment has:
- `OPENAI_API_KEY`
- `OPENAI_API_BASE_URL` (optional)

### Deployment Platforms
- **Vercel**: One-click deploy from GitHub
- **Netlify**: Deploy with environment variables
- **Docker**: Standard Node.js container

## Advanced Usage

### Using Local AI Models
If running a local OpenAI-compatible API:
```env
OPENAI_API_KEY=not-needed
OPENAI_API_BASE_URL=http://localhost:1234/v1
```

### Custom Prompts for Specific Domains
Edit `lib/ai-service.ts` to specialize in:
- Technical documentation
- Historical research
- Scientific explanations
- Language learning
- etc.

### Integration with Other APIs
Modify `app/api/generate/route.ts` to:
- Add image generation
- Include web search results
- Fetch real-time data
- Add citations and references

## Support

For issues or questions:
1. Check this guide
2. Review the main README.md
3. Check browser console for errors
4. Verify API configuration

Happy Learning!
