# RSS Integration Implementation Guide

## Overview
This feature adds RSS feed support to Statsboxd, allowing users to get stats without downloading ZIP files.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AppRss.svelte - User Interface                   │  │
│  │  ├─ Input: Letterboxd username                    │  │
│  │  └─ Process: Submit button click                  │  │
│  └───────────────────────────────────────────────────┘  │
│           ↓                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  rssParser.js - RSS Processing                    │  │
│  │  ├─ fetchLetterboxdRSS() - Fetch RSS              │  │
│  │  ├─ parseRSSFeed() - Parse XML                    │  │
│  │  └─ convertRSSToAppFormat() - Convert to stats    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│            External Services                            │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ Letterboxd RSS Feed  │  │ Your Backend API     │    │
│  │ (Public, No Auth)    │  │ (/stats endpoint)    │    │
│  └──────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Files Added

1. **src/lib/rssParser.js** - Core RSS parsing logic
2. **src/AppRss.svelte** - User interface for RSS input
3. **src/App.svelte** (modified) - Added tab switcher

## How to Use

### For End Users
1. Navigate to Statsboxd
2. Click **📡 RSS Feed** tab
3. Enter Letterboxd username
4. Click **Load Stats via RSS**
5. Stats will load from RSS feed

### For Developers

#### Test Locally
```bash
npm install
npm run dev
# Visit http://localhost:5173
```

#### Troubleshooting CORS Issues

If you see CORS errors:

**Option A: Use Backend Proxy (Recommended)**

Create a proxy endpoint in your backend:

```javascript
// SvelteKit example - src/routes/api/rss/+server.js
export async function GET({ url }) {
    const username = url.searchParams.get('username');
    
    try {
        const response = await fetch(`https://letterboxd.com/${username}/rss/`);
        const text = await response.text();
        
        return new Response(text, {
            headers: {
                'Content-Type': 'application/xml'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

Update `src/lib/rssParser.js`:
```javascript
export async function fetchLetterboxdRSS(username) {
    const rssUrl = `/api/rss?username=${username}`; // Use proxy
    // ... rest of code
}
```

**Option B: Use CORS Proxy Service**

```javascript
const rssUrl = `https://cors-anywhere.herokuapp.com/https://letterboxd.com/${username}/rss/`;
```

(Not recommended for production - rate limits and reliability issues)

## Features

✅ **No ZIP Download Required**
- Users enter username directly
- Automatic RSS fetch and parsing

✅ **No New Dependencies**
- Uses native `fetch()` API
- Uses native `DOMParser` for XML parsing

✅ **Seamless Integration**
- Tab switcher between ZIP and RSS methods
- Same stats calculation backend
- Identical data format

## Limitations

⚠️ **RSS Only Provides Recent Activity**
- Typically last 2-3 months of watches
- For historical data, use ZIP export

⚠️ **Requires Public Profile**
- Letterboxd profile must be public
- RSS feed URL must be publicly accessible

⚠️ **Rate Limiting**
- Letterboxd may rate limit frequent requests
- Add delay if fetching multiple users

## Testing Checklist

- [ ] Load page, see both tabs (Upload ZIP, RSS Feed)
- [ ] Click RSS tab
- [ ] Enter valid username
- [ ] Stats load successfully
- [ ] Stats match Letterboxd profile

## Security Considerations

✅ **Safe Operations**
- RSS is public data (no credentials needed)
- No private data exposed
- Data processed in browser first

⚠️ **Best Practices**
- Validate username input (alphanumeric + underscore)
- Handle errors gracefully
- Don't expose server errors to users

## Next Steps

1. **Deploy to production** after testing
2. **Monitor error logs** for common issues
3. **Add rate limiting** if needed
4. **Consider caching** RSS data (1 hour TTL)

## API Endpoints Used

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `https://letterboxd.com/{username}/rss/` | Fetch activity feed | Public |
| `/stats` (backend) | Calculate statistics | None |

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Letterboxd profile is public
3. Check network tab for request failures
4. Review IMPLEMENTATION_GUIDE.md

---

**Last Updated:** 2026-09-13
**Status:** Ready for Testing
