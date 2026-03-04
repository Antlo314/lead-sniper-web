import Parser from 'rss-parser';
import fs from 'fs';

async function testCraigslist() {
    const parser = new Parser();
    const city = 'newyork';
    const feedUrl = `https://${city}.craigslist.org/search/cpg?format=rss`;
    try {
        const feed = await parser.parseURL(feedUrl);
        return { city, success: true, count: feed.items.length, sample: feed.items[0]?.title };
    } catch (e) {
        return { city, success: false, error: e.message };
    }
}

async function testReddit() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://www.reddit.com/r/forhire/new.json?limit=15`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadSniper/3.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const posts = data?.data?.children || [];
            return { success: true, count: posts.length, sample: posts[0]?.data?.title };
        } else {
            return { success: false, status: res.status, text: await res.text() };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function run() {
    console.log("Starting tests...");
    const cl = await testCraigslist();
    console.log("CL done");
    const rd = await testReddit();
    console.log("RD done");
    fs.writeFileSync('test_output.json', JSON.stringify({ craigslist: cl, reddit: rd }, null, 2));
    console.log("Done. Check test_output.json");
    process.exit(0);
}

run();
