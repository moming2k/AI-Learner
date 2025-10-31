# Performance Improvements for Page Generation

## Summary
This document outlines the performance optimizations implemented to improve OpenAI page generation speed.

## Optimizations Implemented

### 1. Reduced Token Limit (50% Reduction)
- **File**: `app/api/generate/route.ts:28`
- **Change**: Reduced `max_completion_tokens` from 16000 to 8000
- **Impact**: Approximately 40-50% faster response times for typical requests
- **Rationale**: 8000 tokens is sufficient for comprehensive wiki pages while significantly reducing generation time

### 2. Response Caching (5-minute TTL)
- **File**: `lib/ai-service.ts:11-35`
- **Features**:
  - In-memory cache with 5-minute TTL
  - Automatic cache cleanup (max 50 entries)
  - Separate cache keys for wiki pages, questions, and selections
- **Impact**: Instant responses for duplicate requests within 5 minutes
- **Cache hit scenarios**:
  - Regenerating the same topic
  - Multiple users asking the same question
  - Clicking related topics multiple times

### 3. Optimized System Prompts (60% Token Reduction)
- **Files**: `lib/ai-service.ts` (all generation functions)
- **Changes**:
  - Reduced system prompt verbosity by ~60%
  - Removed redundant explanatory text
  - Maintained clear JSON structure requirements
- **Before** (generateWikiPage): ~180 tokens
- **After**: ~70 tokens
- **Impact**: Faster prompt processing and reduced API costs

**Before**:
```
You are an expert educational content creator. Generate comprehensive, well-structured wiki content that is:
- Accurate and informative
- Well-organized with clear sections
- Written in an engaging, accessible style
- Rich with examples and explanations
- Connected to related concepts

Format your response as JSON with this structure:
{...}
```

**After**:
```
You are an expert educator. Create a comprehensive wiki page as JSON:
{...}
```

### 4. Optimized Mindmap Operations
- **File**: `app/page.tsx:556-574`
- **Changes**:
  - Fetch only parent node instead of entire mindmap
  - Batch save multiple nodes in single API call
  - Use optimistic UI updates instead of refetching all pages
- **Impact**: Reduced database queries and faster UI updates

**Before**:
```javascript
const mindmap = await storage.getMindmap(); // Fetches ALL nodes
const parentNode = mindmap.find(n => n.id === currentPage.id);
await storage.saveMindmapNode(parentNode);
await storage.saveMindmapNode(node);
const updatedPages = await storage.getPages(); // Refetch ALL pages
```

**After**:
```javascript
const parentNode = await storage.getMindmapNode(currentPage.id); // Fetch ONE node
await storage.saveMindmapNodes([parentNode, node]); // Batch save
setAllPages(prev => [...prev, newPage]); // Optimistic update
```

### 5. Streaming Support (Infrastructure)
- **File**: `app/api/generate/route.ts:10, 29, 63-72`
- **Changes**:
  - Added `stream` parameter support
  - Returns Server-Sent Events when streaming enabled
  - Maintains backward compatibility with non-streaming mode
- **Status**: Infrastructure ready, can be enabled by setting `stream: true`
- **Future enhancement**: Update client to handle streaming responses for real-time content display

## Performance Metrics (Estimated)

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| First-time page generation | ~15-20s | ~8-12s | **40-50% faster** |
| Cached page (duplicate request) | ~15-20s | <100ms | **99% faster** |
| Mindmap operations | ~500ms | ~150ms | **70% faster** |
| Token processing | ~180 tokens | ~70 tokens | **60% reduction** |

## Additional Benefits

1. **Reduced API Costs**: Shorter prompts = fewer input tokens = lower costs
2. **Better User Experience**: Faster responses and cached results
3. **Scalability**: Cache reduces load on OpenAI API
4. **Future-Ready**: Streaming infrastructure in place for future enhancements

## Configuration

No configuration changes required. All optimizations are automatic.

Optional: To enable streaming in the future, modify `lib/ai-service.ts` and set `stream: true` in fetch calls.

## Testing Recommendations

1. Generate a new page and note the time
2. Regenerate the same page within 5 minutes (should be instant)
3. Generate multiple pages in succession (should be faster due to optimizations)
4. Check browser network tab for reduced response times

## Future Enhancements

1. **Full Streaming Implementation**: Update client to display content as it streams
2. **Persistent Cache**: Use Redis or database for cross-session caching
3. **Smart Prefetching**: Pre-generate related topics in background
4. **Progressive Loading**: Show partial content while generation continues
5. **Model Selection**: Use faster models (e.g., GPT-4o-mini) for simple queries
