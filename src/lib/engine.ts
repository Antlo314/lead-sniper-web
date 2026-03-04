export const URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'yesterday', 'emergency', 'fast', 'quick', 'down right now', 'crashed'];
export const BUDGET_WORDS = ['willing to pay', 'budget', '$$', 'cash', 'paid', 'high ticket', 'lucrative', 'compensation'];
export const TIME_WASTERS = ['equity', 'unpaid', 'rev share', 'revenue share', 'co-founder', 'cofounder', 'startup opportunity', 'no budget', 'deferred pay'];
export const BOS_KEYWORDS = ['mess', 'manual data entry', 'excel', 'spreadsheets', 'unorganized', 'too many emails', 'administrative', 'bottleneck'];

export const REDDIT_SOURCES = ['forhire', 'smallbusiness', 'Entrepreneur', 'sweatystartup', 'slavelabour'];

export interface Lead {
    platform: string;
    title: string;
    description: string;
    link: string;
    published: string;
    score: number;
    pitch: string;
    extractedBudget?: string;
}

export function extractBudget(text: string): string | undefined {
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

export function calculateScore(title: string, description: string): number {
    let score = 50;
    const text = `${title} ${description}`.toLowerCase();

    URGENCY_WORDS.forEach(word => { if (text.includes(word)) score += 15; });
    BUDGET_WORDS.forEach(word => { if (text.includes(word)) score += 10; });
    BOS_KEYWORDS.forEach(word => { if (text.includes(word)) score += 20; });
    TIME_WASTERS.forEach(word => { if (text.includes(word)) score -= 50; });

    if (extractBudget(text)) score += 20;

    return Math.max(0, Math.min(100, score));
}

export function generatePitch(lead: Omit<Lead, 'score' | 'pitch'>): string {
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
