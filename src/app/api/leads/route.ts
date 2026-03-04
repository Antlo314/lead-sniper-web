import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'yesterday', 'emergency', 'fast', 'quick', 'down right now', 'crashed'];
const BUDGET_WORDS = ['willing to pay', 'budget', '$$', 'cash', 'paid', 'high ticket', 'lucrative', 'compensation'];
const TIME_WASTERS = ['equity', 'unpaid', 'rev share', 'revenue share', 'co-founder', 'cofounder', 'startup opportunity', 'no budget', 'deferred pay'];
const BOS_KEYWORDS = ['mess', 'manual data entry', 'excel', 'spreadsheets', 'unorganized', 'too many emails', 'administrative', 'bottleneck'];

const REDDIT_SOURCES = ['forhire', 'smallbusiness', 'Entrepreneur'];
const CRAIGSLIST_HUBS = ['newyork', 'sfbay', 'losangeles', 'austin'];

interface Lead {
    platform: string;
    title: string;
    description: string;
    link: string;
    published: string;
    score?: number;
    pitch?: string;
    extractedBudget?: string;
}

function extractBudget(text: string): string | undefined {
    // Look for patterns like $500, $1,000, $50k, 500 USD
    const dollarRegex = /\$([0-9,]+(?:k|K)?)/g;
    const match = dollarRegex.exec(text);
    if (match) {
        return `$$${match[1]}`;
    }

    const usdRegex = /([0-9,]+(?:k|K)?)\s*USD/gi;
    const usdMatch = usdRegex.exec(text);
    if (usdMatch) {
        return `$$${usdMatch[1]}`;
    }
    return undefined;
}

function calculateScore(title: string, description: string): number {
    let score = 50;
    const text = `${title} ${description}`.toLowerCase();

    URGENCY_WORDS.forEach(word => { if (text.includes(word)) score += 15; });
    BUDGET_WORDS.forEach(word => { if (text.includes(word)) score += 10; });
    BOS_KEYWORDS.forEach(word => { if (text.includes(word)) score += 20; });
    TIME_WASTERS.forEach(word => { if (text.includes(word)) score -= 50; });

    // Has explicit budget? Huge bonus.
    if (extractBudget(text)) score += 20;

    return Math.max(0, Math.min(100, score));
}

function generatePitch(lead: Lead): string {
    const title = lead.title.toLowerCase();
    const desc = lead.description.toLowerCase();

    if (title.includes('paralegal') || title.includes('business') || title.includes('admin') || BOS_KEYWORDS.some(w => desc.includes(w))) {
        return "Hey! I saw your post looking for help with admin/paralegal work. Instead of just manual labor, I build custom Business Operating Systems (BOS) that automate document prep, client intake, and eliminate messy spreadsheets entirely. I can set this up for you in a few days so your firm runs on autopilot. Open to a quick 5-min chat?";
    }

    if (URGENCY_WORDS.some(w => desc.includes(w)) && (title.includes('website') || title.includes('python') || title.includes('fix') || title.includes('wordpress'))) {
        return "Hey! I saw this is extremely urgent. I'm a developer and I can jump on this right now and get it fixed/built for you today. Let me know if you want me to start immediately.";
    }

    return "Hi there, I came across your post and I'm highly confident I can execute this perfectly and quickly. I build high-end web apps, automations, and custom software. When are you looking to get this started? I have capacity this week.";
}

async function fetchCraigslist(city: string): Promise<Lead[]> {
    const parser = new Parser();
    const jobs: Lead[] = [];
    try {
        // Craigslist Computer Gigs RSS is still fully public and active
        const feedUrl = `https://${city}.craigslist.org/search/cpg?format=rss`;
        const feed = await parser.parseURL(feedUrl);

        feed.items.forEach(item => {
            jobs.push({
                platform: `Craigslist (${city})`,
                title: item.title || 'Untitled',
                description: item.contentSnippet || item.content || '',
                link: item.link || '',
                published: item.isoDate || new Date().toISOString()
            });
        });
    } catch (e) {
        console.error(`Craigslist RSS parser failed for city: ${city}`);
    }
    return jobs;
}

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
                    description: p.selftext,
                    link: `https://reddit.com${p.permalink}`,
                    published: new Date(p.created_utc * 1000).toISOString()
                });
            }
        });
    } catch (e) { console.error(`Reddit fetch failed for ${subreddit}`); }
    return jobs;
}

export async function GET() {
    try {
        const clPromises = CRAIGSLIST_HUBS.map(c => fetchCraigslist(c));
        const redditPromises = REDDIT_SOURCES.map(r => fetchReddit(r));

        const clResults = await Promise.all(clPromises);
        const redditResults = await Promise.all(redditPromises);

        let allLeads = [
            ...clResults.flat(),
            ...redditResults.flat()
        ];

        allLeads = allLeads.map(lead => {
            const textForBudget = `${lead.title} ${lead.description}`;
            return {
                ...lead,
                score: calculateScore(lead.title, lead.description),
                pitch: generatePitch(lead),
                extractedBudget: extractBudget(textForBudget)
            };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));

        // Cap at top 100 leads to keep dashboard fast
        return NextResponse.json(allLeads.slice(0, 100));
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch aggregated leads" }, { status: 500 });
    }
}
