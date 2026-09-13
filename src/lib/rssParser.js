export async function fetchLetterboxdRSS(username) {
    const rssUrl = `https://letterboxd.com/${username}/rss/`;
    try {
        const response = await fetch(rssUrl);
        if (!response.ok) throw new Error('Failed to fetch RSS feed');
        const text = await response.text();
        return parseRSSFeed(text, username);
    } catch (error) {
        throw new Error(`Could not fetch RSS for ${username}: ${error.message}`);
    }
}

function parseRSSFeed(xmlText, username) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    if (xmlDoc.getElementsByTagName('parsererror').length) {
        throw new Error('Failed to parse RSS feed');
    }

    const items = xmlDoc.getElementsByTagName('item');
    const watched = [];
    const diaryDict = {};

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = item.getElementsByTagName('title')[0]?.textContent || '';
        const description = item.getElementsByTagName('description')[0]?.textContent || '';
        const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
        const link = item.getElementsByTagName('link')[0]?.textContent || '';

        // Extract movie ID from link: https://letterboxd.com/film/movie-name/
        const filmMatch = link.match(/letterboxd\.com\/film\/([^\/]+)\/);
        if (!filmMatch) continue;

        const filmId = filmMatch[1];
        const watchDate = new Date(pubDate).toISOString().split('T')[0];

        // Extract movie title and year from RSS title format: "Username watched Movie Name (Year)"
        const titleMatch = title.match(/watched\s+(.+?)\s+\((\d{4})\)/);
        const movieTitle = titleMatch ? titleMatch[1] : filmId;
        const year = titleMatch ? titleMatch[2] : new Date(pubDate).getFullYear();
        const key = `${movieTitle}_${year}`;

        // Parse rating from description if present
        const ratingMatch = description.match(/★{0,5}(?:½)?/);
        const rating = ratingMatch ? countStars(ratingMatch[0]) : null;

        // Add to watched
        if (!watched.find(w => w._id === filmId)) {
            watched.push({
                _id: filmId,
                r: rating,
                d: []
            });
        }

        // Track diary entry
        if (!diaryDict[key]) {
            diaryDict[key] = [];
        }
        diaryDict[key].push({
            date: watchDate,
            rewatch: false,
            review: description.includes('review')
        });
    }

    return { watched, diaryDict };
}

function countStars(starString) {
    const fullStars = (starString.match(/★/g) || []).length;
    const hasHalf = starString.includes('½');
    return fullStars + (hasHalf ? 0.5 : 0);
}

export function convertRSSToAppFormat(rssData, username) {
    return {
        username: username.toLowerCase(),
        name: username,
        watched: rssData.watched,
        update: new Date().toISOString().split('T')[0],
        ru: rssData.watched.some(w => w.r !== null && w.r !== undefined)
    };
}
