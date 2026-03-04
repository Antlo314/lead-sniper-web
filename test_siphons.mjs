import Parser from 'rss-parser';

async function testUpwork() {
    const parser = new Parser();
    const query = 'automation';
    const feedUrl = `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(query)}&sort=recency`;
    try {
        const feed = await parser.parseURL(feedUrl);
        console.log("Upwork success! Items:", feed.items.length);
    } catch (e) {
        console.log("Upwork error:", e.message);
    }
}

async function testReddit() {
    try {
        const res = await fetch(`https://www.reddit.com/r/forhire/new.json?limit=15`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadSniper/3.0' }
        });
        console.log("Reddit status:", res.status);
    } catch (e) {
        console.log("Reddit error:", e.message);
    }
}

testUpwork();
testReddit();
