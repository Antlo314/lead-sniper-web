import { NextResponse } from 'next/server';

const URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'yesterday', 'emergency', 'fast', 'quick', 'down right now', 'crashed'];
const BUDGET_WORDS = ['willing to pay', 'budget', '$$', 'cash', 'paid', 'high ticket', 'lucrative', 'compensation'];
const TIME_WASTERS = ['equity', 'unpaid', 'rev share', 'revenue share', 'co-founder', 'cofounder', 'startup opportunity', 'no budget', 'deferred pay'];
const BOS_KEYWORDS = ['mess', 'manual data entry', 'excel', 'spreadsheets', 'unorganized', 'too many emails', 'administrative', 'bottleneck'];

interface Lead {
    platform: string;
    title: string;
    description: string;
    link: string;
    published: string;
    score?: number;
    pitch?: string;
}

function calculateScore(title: string, description: string): number {
    let score = 50;
    const text = `${title} ${description}`.toLowerCase();

    URGENCY_WORDS.forEach(word => { if (text.includes(word)) score += 15; });
    BUDGET_WORDS.forEach(word => { if (text.includes(word)) score += 10; });
    BOS_KEYWORDS.forEach(word => { if (text.includes(word)) score += 20; });
    TIME_WASTERS.forEach(word => { if (text.includes(word)) score -= 50; });

    return Math.max(0, Math.min(100, score));
}

function generatePitch(lead: Lead): string {
    const title = lead.title.toLowerCase();
    const desc = lead.description.toLowerCase();

    if (title.includes('paralegal') || title.includes('business') || title.includes('admin') || BOS_KEYWORDS.some(w => desc.includes(w))) {
        return "Hey! I saw your post looking for help with admin/paralegal work. Instead of just manual labor, I build custom Business Operating Systems (BOS) that automate document prep, client intake, and eliminate messy spreadsheets entirely. I can set this up for you in a few days so your firm runs on autopilot. Open to a quick 5-min chat?";
    }

    if (URGENCY_WORDS.some(w => desc.includes(w)) && (title.includes('website') || title.includes('python') || title.includes('fix'))) {
        return "Hey! I saw this is extremely urgent. I'm a developer and I can jump on this right now and get it fixed/built for you today. Let me know if you want me to start immediately.";
    }

    return "Hi there, I came across your post and I'm highly confident I can execute this perfectly and quickly. I build high-end web apps, automations, and custom software. When are you looking to get this started? I have capacity this week.";
}

// Mock Upwork / Indeed feeds for reliability (RSS often blocked or requires auth)
async function fetchUpwork(): Promise<Lead[]> {
    return [
        { platform: "Upwork", title: "Urgent fix for WordPress site - crashed!", description: "Ecommerce site is down. Losing money. Need database fixed ASAP. Budget $500.", link: "https://upwork.com", published: new Date().toISOString() },
        { platform: "Upwork", title: "Build simple python scraper", description: "Need to scrape 500 pages tonight. Willing to pay. No agencies.", link: "https://upwork.com", published: new Date().toISOString() },
        { platform: "Upwork", title: "Looking for equity cofounder", description: "Takes 6 months. Unpaid but 5% rev share when launched.", link: "https://upwork.com", published: new Date().toISOString() }
    ];
}

async function fetchIndeed(): Promise<Lead[]> {
    return [
        { platform: "Indeed", title: "Remote Paralegal", description: "Busy firm needs remote paralegal. We use excel and it's a huge mess. Data entry bottleneck.", link: "https://indeed.com", published: new Date().toISOString() }
    ];
}

async function fetchReddit(): Promise<Lead[]> {
    const jobs: Lead[] = [];
    try {
        const res = await fetch('https://www.reddit.com/r/forhire/new.json?limit=10', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadSniper/2.0' },
            next: { revalidate: 60 }
        });
        const data = await res.json();
        data?.data?.children?.forEach((post: any) => {
            const p = post.data;
            if (p.title.toLowerCase().includes('[hiring]') || p.title.toLowerCase().includes('[task]')) {
                jobs.push({
                    platform: "Reddit (r/forhire)",
                    title: p.title,
                    description: p.selftext,
                    link: `https://reddit.com${p.permalink}`,
                    published: new Date(p.created_utc * 1000).toISOString()
                });
            }
        });
    } catch (e) { console.error("Reddit fetch failed", e); }
    return jobs;
}

export async function GET() {
    try {
        const [upwork, indeed, reddit] = await Promise.all([
            fetchUpwork(), fetchIndeed(), fetchReddit()
        ]);

        let allLeads = [...upwork, ...indeed, ...reddit];
        allLeads = allLeads.map(lead => ({
            ...lead,
            score: calculateScore(lead.title, lead.description),
            pitch: generatePitch(lead)
        })).sort((a, b) => (b.score || 0) - (a.score || 0));

        return NextResponse.json(allLeads);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }
}
