# Quick Start - AI Learning Wiki

## 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your OpenAI API key to .env.local
echo "OPENAI_API_KEY=sk-your-openai-key-here" >> .env.local
echo "OPENAI_MODEL=gpt-3.5-turbo" >> .env.local

# 3. Start the app
npm run dev

# 4. Open http://localhost:3000
```

Done! Start exploring any topic.

## First Steps

1. **Enter a topic** - Type anything you want to learn about
2. **Read the AI-generated wiki** - Comprehensive, structured content
3. **Ask questions** - Dive deeper with natural language
4. **Explore related topics** - Click suggested topics to expand knowledge
5. **Bookmark favorites** - Save important pages for later

## Example Exploration Path

```
Start: "Machine Learning"
  ↓
Generated wiki page with overview, concepts, applications
  ↓
Ask: "How do neural networks work?"
  ↓
New page explaining neural networks
  ↓
Click related topic: "Deep Learning"
  ↓
Continue exploring...
```

## Key Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Check code quality

# Useful during development
rm -rf .next         # Clear build cache if needed
```

## Configuration Files

**`.env.local`** - Your OpenAI API configuration
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo                      # or gpt-4
OPENAI_API_BASE_URL=https://api.openai.com/v1   # Optional
```

## Project Files at a Glance

```
app/
  page.tsx           - Main app (where the magic happens)
  layout.tsx         - Root layout, fonts, metadata
  globals.css        - Global styles
  api/generate/      - AI content generation endpoint

components/
  TopicSearch.tsx    - Topic entry interface
  WikiPage.tsx       - Wiki display with markdown
  QuestionInput.tsx  - Ask questions component
  Sidebar.tsx        - Navigation & bookmarks

lib/
  types.ts           - TypeScript definitions
  storage.ts         - localStorage management
  ai-service.ts      - AI generation logic
```

## Common Tasks

### Change AI Model
Edit `.env.local`:
```env
OPENAI_MODEL=gpt-4  # Options: gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview
```

### Adjust Creativity
Edit `app/api/generate/route.ts`:
```typescript
temperature: 0.7  // 0.0 = focused, 1.0 = creative
```

### Clear All Data
In browser console:
```javascript
localStorage.clear()
location.reload()
```

### View Stored Pages
In browser console:
```javascript
JSON.parse(localStorage.getItem('wiki_pages'))
```

## Troubleshooting

**"Failed to generate"**
- Check `.env.local` has your API key
- Restart dev server after adding `.env.local`

**TypeScript errors**
```bash
rm -rf .next && npm run dev
```

**No pages showing**
- Check browser console for errors
- Verify localStorage is enabled
- Try a different browser

## Tips

1. **Use example topics** - Click the suggestion buttons to start
2. **Ask specific questions** - More specific = better answers
3. **Explore related topics** - Build your knowledge graph
4. **Bookmark often** - Save your learning path
5. **Check breadcrumbs** - See where you've been

## What Makes This Special

- 🤖 **AI-Generated Content** - Fresh content for any topic
- 🎯 **Question-Driven** - Learn by asking
- 🗺️ **Knowledge Graph** - Automatic topic organization
- 💾 **Local Storage** - Your data stays private
- 🎨 **Beautiful Design** - Premium, modern interface
- 📱 **Responsive** - Works on desktop and tablet

## Next Steps

After getting familiar:
- Read `SETUP_GUIDE.md` for detailed configuration
- See `FEATURES.md` for complete feature list
- Check `PROJECT_STRUCTURE.md` to understand the codebase
- Customize prompts in `lib/ai-service.ts`

## Support

- Issues? Check console for errors
- Questions? See `SETUP_GUIDE.md`
- Contributing? Read `README.md`

---

**Now go explore! Enter any topic and start your learning journey.**
