import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import {
    calculateScore,
    extractBudget,
    generatePitch,
    Lead,
    REDDIT_SOURCES,
    CRAIGSLIST_STATES,
    getHackerNewsApiUrl,
    WWR_RSS_URL,
    REMOTE_OK_RSS_URL,
    getTwitterFrustrationRss
} from '@/lib/engine'; // Re-use the engine's definitions

export const dynamic = 'force-dynamic';

async function fetchReddit(subreddit: string): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second strict timeout for Vercel

        const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=15`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            next: { revalidate: 60 },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return jobs;

        const data = await res.json();
        data?.data?.children?.forEach((post: any) => {
            const p = post.data;
            const titleLower = p.title.toLowerCase();
            const needsHelp = titleLower.includes('[hiring]') || titleLower.includes('[task]') || titleLower.includes('need help') || titleLower.includes('looking for');

            // Filter out people looking FOR jobs ("[For Hire]")
            if (needsHelp && !titleLower.includes('[for hire]')) {
                jobs.push({
                    platform: `Reddit (r/${subreddit})`,
                    title: p.title,
                    description: p.selftext || '',
                    link: `https://reddit.com${p.permalink}`,
                    published: new Date(p.created_utc * 1000).toISOString(),
                    score: 0,
                    pitch: ''
                });
            }
        });
    } catch (e) {
        console.error(`Reddit fetch failed for ${subreddit}`);
    }
    return jobs;
}

async function fetchCraigslist(stateCode: string): Promise<Lead[]> {
    const jobs: Lead[] = [];
    const stateData = CRAIGSLIST_STATES[stateCode];
    if (!stateData) return jobs;

    const parser = new Parser();
    // Fetch a couple subdomains per state to keep it fast
    const subdomainsToFetch = stateData.subdomains.slice(0, 2);

    for (const subdomain of subdomainsToFetch) {
        try {
            // Craigslist admin/office jobs
            const feedUrl = `https://${subdomain}.craigslist.org/search/ofc?format=rss`;
            const feed = await parser.parseURL(feedUrl);

            feed.items.forEach(item => {
                jobs.push({
                    platform: `Craigslist (${subdomain})`,
                    title: item.title || '',
                    description: item.contentSnippet || item.content || '',
                    link: item.link || '',
                    published: item.isoDate || new Date().toISOString(),
                    score: 0,
                    pitch: ''
                });
            });
        } catch (e) {
            console.error(`Craigslist fetch failed for ${subdomain}`);
        }
    }
    return jobs;
}

async function fetchHackerNews(): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(getHackerNewsApiUrl('Admin/Ops'), {
            signal: controller.signal,
            next: { revalidate: 300 }
        });
        clearTimeout(timeoutId);

        if (!res.ok) return jobs;

        const data = await res.json();
        data?.hits?.forEach((hit: any) => {
            jobs.push({
                platform: 'HackerNews (Startup Drain)',
                title: 'Startup Hiring (HN Who is Hiring)',
                description: hit.comment_text || '',
                link: `https://news.ycombinator.com/item?id=${hit.objectID}`,
                published: hit.created_at || new Date().toISOString(),
                score: 0,
                pitch: ''
            });
        });
    } catch (e) {
        console.error('HackerNews fetch failed');
    }
    return jobs;
}

async function fetchWWR(): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const parser = new Parser();
        const feed = await parser.parseURL(WWR_RSS_URL);

        feed.items.forEach(item => {
            jobs.push({
                platform: 'We Work Remotely',
                title: item.title || '',
                description: item.contentSnippet || item.content || '',
                link: item.link || '',
                published: item.isoDate || new Date().toISOString(),
                score: 0,
                pitch: ''
            });
        });
    } catch (e) {
        console.error('WWR fetch failed');
    }
    return jobs;
}

async function fetchRemoteOK(): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(REMOTE_OK_RSS_URL, {
            signal: controller.signal,
            next: { revalidate: 300 }
        });
        clearTimeout(timeoutId);

        if (!res.ok) return jobs;

        const data = await res.json();
        // Skip the first item which is usually metadata on remoteok
        data.slice(1).forEach((job: any) => {
            jobs.push({
                platform: 'Remote OK',
                title: job.position || '',
                description: job.description || '',
                link: job.url || '',
                published: job.date || new Date().toISOString(),
                score: 0,
                pitch: ''
            });
        });
    } catch (e) {
        console.error('RemoteOK fetch failed');
    }
    return jobs;
}

async function fetchTwitterFrustration(): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const parser = new Parser();
        const feed = await parser.parseURL(getTwitterFrustrationRss('Admin/Ops'));

        feed.items.forEach(item => {
            jobs.push({
                platform: 'Twitter (Frustration Engine)',
                title: item.title || '',
                description: item.contentSnippet || item.content || '',
                link: item.link || '',
                published: item.isoDate || new Date().toISOString(),
                score: 0,
                pitch: ''
            });
        });
    } catch (e) {
        console.error('Twitter fetch failed');
    }
    return jobs;
}

export async function GET() {
    try {
        // Fetch from all sources concurrently
        const [
            redditResults,
            craigslistGA,
            craigslistNY,
            craigslistCA,
            craigslistTX,
            hnResults,
            wwrResults,
            remoteOkResults,
            twitterResults
        ] = await Promise.all([
            // Limit Reddit to 2 subreddits to save time/bandwidth
            Promise.all(REDDIT_SOURCES.slice(0, 2).map(r => fetchReddit(r))).then(results => results.flat()),
            fetchCraigslist('GA'),
            fetchCraigslist('NY'),
            fetchCraigslist('CA'),
            fetchCraigslist('TX'),
            fetchHackerNews(),
            fetchWWR(),
            fetchRemoteOK(),
            fetchTwitterFrustration()
        ]);

        let allLeads = [
            ...redditResults,
            ...craigslistGA,
            ...craigslistNY,
            ...craigslistCA,
            ...craigslistTX,
            ...hnResults,
            ...wwrResults,
            ...remoteOkResults,
            ...twitterResults
        ];

        // Process, score, and pitch
        allLeads = allLeads.map(lead => {
            const textForBudget = `${lead.title} ${lead.description}`;
            const calculatedScore = calculateScore(lead.title, lead.description);
            const budget = extractBudget(textForBudget);

            // Generate pitch needs a lead object without score/pitch according to engine.ts interface
            const leadForPitch = {
                platform: lead.platform,
                title: lead.title,
                description: lead.description,
                link: lead.link,
                published: lead.published,
                extractedBudget: budget
            };

            return {
                ...lead,
                score: calculatedScore,
                pitch: generatePitch(leadForPitch),
                extractedBudget: budget
            };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));

        // Cap at top 100 leads
        return NextResponse.json(allLeads.slice(0, 100));
    } catch (error) {
        console.error("Aggregation Failed:", error);
        return NextResponse.json({ error: "Failed to fetch aggregated leads" }, { status: 500 });
    }
}

