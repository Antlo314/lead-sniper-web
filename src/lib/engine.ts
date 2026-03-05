export const URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'yesterday', 'emergency', 'fast', 'quick', 'down right now', 'crashed'];
export const BUDGET_WORDS = ['willing to pay', 'budget', '$$', 'cash', 'paid', 'high ticket', 'lucrative', 'compensation'];
export const TIME_WASTERS = ['equity', 'unpaid', 'rev share', 'revenue share', 'co-founder', 'cofounder', 'startup opportunity', 'no budget', 'deferred pay'];
export const BOS_KEYWORDS = ['mess', 'manual data entry', 'excel', 'spreadsheets', 'unorganized', 'too many emails', 'administrative', 'bottleneck', 'data entry', 'virtual assistant', 'office manager', 'operations', 'logistics'];
export const PHYSICAL_PRESENCE = ['receptionist', 'door', 'warehouse', 'valet', 'in-person', 'front desk', 'cleaning', 'driving', 'forklift', 'cashier', 'stocker', 'janitor', 'delivery', 'cook', 'server', 'bartender', 'guard'];
export const OUT_OF_SCOPE_TECH = ['c++', 'java ', ' swift ', 'ios', 'android', 'kotlin', ' rust ', 'embedded', 'unity', 'unreal', '.net', 'c#', 'objective-c', 'game developer'];
export const ANTIGRAVITY_TECH = ['next.js', 'react', 'python', 'supabase', 'vercel', 'automation', 'zapier', 'make.com', 'ai ', 'llm', 'openai', 'scraping', 'typescript', 'tailwind', 'api', 'chatbot', 'agent'];
export const REDDIT_SOURCES = ['forhire', 'smallbusiness', 'Entrepreneur', 'sweatystartup', 'slavelabour'];

// Upwork specifically uses RSS for custom searches. 
// %28 = ( ... %29 = ) ... %20OR%20 = OR
export const UPWORK_RSS_URL = "https://www.upwork.com/ab/feed/jobs/rss?q=%28data%20entry%20OR%20virtual%20assistant%20OR%20admin%29";

// Niche Developer Job Boards
export const WWR_RSS_URL = "https://weworkremotely.com/categories/remote-customer-support-jobs.rss";
export const REMOTE_OK_RSS_URL = "https://remoteok.com/api"; // Returns JSON natively, but we can treat it similarly.

// Tier 1: The Frustration Engine (Twitter/X Google Dork)
// We use Google News to index Twitter posts containing specific pain points.
export const TWITTER_FRUSTRATION_RSS = 'https://news.google.com/rss/search?q=site:twitter.com+"hate+spreadsheets"+OR+"drowning+in+data"+OR+"Zapier+is+broken"+OR+"manual+entry"&hl=en-US&gl=US&ceid=US:en';

// Tier 1: The Startup Drain (Wellfound/AngelList workaround)
// Since Wellfound is heavily gated, we search YCombinator's HackerNews Who Is Hiring instead for max startup density.
export const HACKERNEWS_API_BASE = "https://hn.algolia.com/api/v1/search_by_date?query=hiring+operations+OR+admin+OR+data&tags=comment";

// Craigslist Blast Radius - 50 State Mapping
export const CRAIGSLIST_STATES: Record<string, { label: string, subdomains: string[] }> = {
    'AL': { label: 'Alabama', subdomains: ['birmingham', 'huntsville', 'mobile', 'montgomery', 'tuscaloosa'] },
    'AK': { label: 'Alaska', subdomains: ['anchorage', 'fairbanks', 'juneau', 'kenai'] },
    'AZ': { label: 'Arizona', subdomains: ['phoenix', 'tucson', 'flagstaff', 'prescott', 'yuma'] },
    'AR': { label: 'Arkansas', subdomains: ['fayetteville', 'fortsmith', 'jonesboro', 'littlerock', 'texarkana'] },
    'CA': { label: 'California', subdomains: ['losangeles', 'sfbay', 'sandiego', 'sacramento', 'fresno', 'bakersfield', 'chico', 'goldcountry', 'hanford', 'humboldt', 'imperial', 'inlandempire', 'mendocino', 'merced', 'modesto', 'monterey', 'orangecounty', 'palmsprings', 'redding', 'reno', 'santamaria', 'siskiyou', 'stockton', 'susanville', 'ventura', 'visalia', 'yuba'] },
    'CO': { label: 'Colorado', subdomains: ['denver', 'boulder', 'coloradosprings', 'fortcollins', 'pueblo', 'westslope', 'rockies'] },
    'CT': { label: 'Connecticut', subdomains: ['newhaven', 'hartford', 'nwct', 'easternct'] },
    'DE': { label: 'Delaware', subdomains: ['delaware'] },
    'FL': { label: 'Florida', subdomains: ['miami', 'tampa', 'orlando', 'jacksonville', 'fortlauderdale', 'fortmyers', 'gainesville', 'keys', 'lakeland', 'ocala', 'panamacity', 'pensacola', 'sarasota', 'spacecoast', 'staugustine', 'tallahassee', 'treasure'] },
    'GA': { label: 'Georgia', subdomains: ['atlanta', 'athens', 'augusta', 'brunswick', 'columbusga', 'macon', 'savannah', 'statesboro', 'valdosta'] },
    'HI': { label: 'Hawaii', subdomains: ['honolulu'] },
    'ID': { label: 'Idaho', subdomains: ['boise', 'eastidaho', 'lewiston', 'twinfalls'] },
    'IL': { label: 'Illinois', subdomains: ['chicago', 'peoria', 'springfield', 'champaign', 'bn', 'carbondale', 'decatur', 'lasalle', 'mattoon', 'quincy', 'rockford'] },
    'IN': { label: 'Indiana', subdomains: ['indianapolis', 'fortwayne', 'evansville', 'southbend', 'bloomington', 'lafayette', 'muncie', 'richmond', 'terrehaute'] },
    'IA': { label: 'Iowa', subdomains: ['desmoines', 'cedarrapids', 'davenport', 'ames', 'dubuque', 'fortdodge', 'iowacity', 'masoncity', 'omaha', 'siouxcity', 'waterloo'] },
    'KS': { label: 'Kansas', subdomains: ['wichita', 'lawrence', 'manhattan', 'topeka', 'nwks', 'salina', 'seks', 'swks'] },
    'KY': { label: 'Kentucky', subdomains: ['louisville', 'lexington', 'bowlinggreen', 'eastky', 'owensboro', 'westky'] },
    'LA': { label: 'Louisiana', subdomains: ['neworleans', 'batonrouge', 'lafayette', 'shreveport', 'alexandria', 'houma', 'lakecharles', 'monroe'] },
    'ME': { label: 'Maine', subdomains: ['maine'] },
    'MD': { label: 'Maryland', subdomains: ['baltimore', 'annapolis', 'easternshore', 'frederick', 'smd', 'westmd'] },
    'MA': { label: 'Massachusetts', subdomains: ['boston', 'worcester', 'westernmass', 'southcoast', 'capecod'] },
    'MI': { label: 'Michigan', subdomains: ['detroit', 'grandrapids', 'lansing', 'annarbor', 'kalamazoo', 'flint', 'saginaw', 'jacksontn', 'battlecreek', 'centralmich', 'holland', 'monroemi', 'muskegon', 'nmi', 'porthuron', 'swmi', 'thumb', 'up'] },
    'MN': { label: 'Minnesota', subdomains: ['minneapolis', 'stpaul', 'duluth', 'rochester', 'bemidji', 'brainerd', 'fargo', 'mankato', 'stcloud'] },
    'MS': { label: 'Mississippi', subdomains: ['jackson', 'gulfport', 'hattiesburg', 'meridian', 'natchez', 'northms'] },
    'MO': { label: 'Missouri', subdomains: ['stlouis', 'kansascity', 'springfield', 'columbia', 'joplin', 'kirksville', 'lakeoftheozarks', 'semo', 'stjoseph'] },
    'MT': { label: 'Montana', subdomains: ['billings', 'bozeman', 'missoula', 'butte', 'greatfalls', 'helena', 'kalispell'] },
    'NE': { label: 'Nebraska', subdomains: ['omaha', 'lincoln', 'grandisland', 'scottsbluff'] },
    'NV': { label: 'Nevada', subdomains: ['lasvegas', 'reno', 'elko'] },
    'NH': { label: 'New Hampshire', subdomains: ['nh'] },
    'NJ': { label: 'New Jersey', subdomains: ['cnj', 'jerseyshore', 'newjersey', 'southjersey'] },
    'NM': { label: 'New Mexico', subdomains: ['albuquerque', 'santafe', 'lascruces', 'clovis', 'farmington', 'roswell'] },
    'NY': { label: 'New York', subdomains: ['newyork', 'longisland', 'albany', 'binghamton', 'buffalo', 'catskills', 'chautauqua', 'elmira', 'fingerlakes', 'glensfalls', 'hudsonvalley', 'ithaca', 'oneonta', 'plattsburgh', 'potsdam', 'rochester', 'syracuse', 'twintiers', 'utica', 'watertown'] },
    'NC': { label: 'North Carolina', subdomains: ['charlotte', 'raleigh', 'asheville', 'boone', 'eastnc', 'fayetteville', 'greensboro', 'hickory', 'outerbanks', 'wilmington', 'winstonsalem'] },
    'ND': { label: 'North Dakota', subdomains: ['fargo', 'bismarck', 'grandforks', 'nd'] },
    'OH': { label: 'Ohio', subdomains: ['columbus', 'cleveland', 'cincinnati', 'athensohio', 'canton', 'chillicothe', 'dayton', 'lima', 'mansfield', 'sandusky', 'toledo', 'tuscarawas', 'youngstown', 'zanesville'] },
    'OK': { label: 'Oklahoma', subdomains: ['oklahomacity', 'tulsa', 'lawton', 'enid', 'stillwater'] },
    'OR': { label: 'Oregon', subdomains: ['portland', 'eugene', 'bend', 'corvallis', 'eastoregon', 'klamath', 'medford', 'oregoncoast', 'roseburg', 'salem'] },
    'PA': { label: 'Pennsylvania', subdomains: ['philadelphia', 'pittsburgh', 'allentown', 'altoona', 'chambersburg', 'erie', 'harrisburg', 'lancaster', 'meadville', 'pennstate', 'reading', 'scranton', 'williamsport', 'york'] },
    'RI': { label: 'Rhode Island', subdomains: ['providence'] },
    'SC': { label: 'South Carolina', subdomains: ['charleston', 'columbia', 'greenville', 'florence', 'hiltonhead', 'myrtlebeach'] },
    'SD': { label: 'South Dakota', subdomains: ['siouxfalls', 'rapidcity', 'csd', 'nesd', 'pierre'] },
    'TN': { label: 'Tennessee', subdomains: ['nashville', 'memphis', 'knoxville', 'chattanooga', 'clarksville', 'cookeville', 'jacksontn', 'tricities'] },
    'TX': { label: 'Texas', subdomains: ['houston', 'dallas', 'austin', 'sanantonio', 'elpaso', 'abilene', 'amarillo', 'beaumont', 'brownsville', 'collegestation', 'corpuschristi', 'delrio', 'galveston', 'killeen', 'laredo', 'lubbock', 'mcallen', 'odessa', 'sanangelo', 'sanmarcos', 'textoma', 'tyler', 'victoria', 'waco', 'wichitafalls'] },
    'UT': { label: 'Utah', subdomains: ['saltlakecity', 'logan', 'ogden', 'provo', 'stgeorge'] },
    'VT': { label: 'Vermont', subdomains: ['burlington'] },
    'VA': { label: 'Virginia', subdomains: ['richmond', 'norfolk', 'charlottesville', 'danville', 'fredericksburg', 'harrisonburg', 'lynchburg', 'blacksburg', 'roanoke', 'swva', 'winchester'] },
    'WA': { label: 'Washington', subdomains: ['seattle', 'spokane', 'bellingham', 'kpr', 'moseslake', 'olympic', 'pullman', 'wenatchee', 'yakima'] },
    'WV': { label: 'West Virginia', subdomains: ['charlestonwv', 'huntington', 'martinsburg', 'morgantown', 'parkersburg', 'swv'] },
    'WI': { label: 'Wisconsin', subdomains: ['milwaukee', 'madison', 'appleton', 'eauclaire', 'greenbay', 'janesville', 'lacrosse', 'northernwi', 'sheboygan', 'wausau'] },
    'WY': { label: 'Wyoming', subdomains: ['wyoming'] }
};

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
    // Standard $10k regex
    const dollarRegex = /\$([0-9,]+(?:k|K)?)\b(?!(\/| per | a )?(hr|hour|yr|year))/ig;
    const match = dollarRegex.exec(text);
    if (match) {
        return `$$${match[1]}`;
    }

    // High Salary detection (yearly) with +30% True Cost Math
    const yearlyRegex = /\$([0-9,]{2,3}(?:k|K|000))(?:\/yr|\/year| per year| a year| annually)/i;
    const yearlyMatch = yearlyRegex.exec(text);
    if (yearlyMatch) {
        let baseStr = yearlyMatch[1].toLowerCase().replace('k', '000').replace(',', '');
        let baseInt = parseInt(baseStr, 10);
        if (!isNaN(baseInt) && baseInt > 20000) {
            let trueCost = Math.floor(baseInt * 1.3); // Add 30% for employer overhead
            return `$$${Math.floor(trueCost / 1000)}k/yr (True Cost)`;
        }
        return `$$${yearlyMatch[1]}/yr`;
    }

    // Upwork specific Budget tags from their RSS descriptions
    const upworkRegex = /Budget:? \$([0-9,]+)/i;
    const upworkMatch = upworkRegex.exec(text);
    if (upworkMatch) {
        return `$$${upworkMatch[1]}`;
    }

    // Hourly rates
    const hourlyRegex = /(?:Hourly Range:? )?\$([0-9.]+)-\$([0-9.]+)(?:\/hr|\/hour)?/i;
    const hourlyMatch = hourlyRegex.exec(text);
    if (hourlyMatch) {
        return `$$${hourlyMatch[1]}-${hourlyMatch[2]}/hr`;
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

    // Instant disqualifiers
    if (PHYSICAL_PRESENCE.some(word => text.includes(word))) {
        return 0; // Drop score to 0 immediately
    }
    if (OUT_OF_SCOPE_TECH.some(word => text.includes(word))) {
        return 0; // Drop score to 0 immediately
    }

    URGENCY_WORDS.forEach(word => { if (text.includes(word)) score += 15; });
    BUDGET_WORDS.forEach(word => { if (text.includes(word)) score += 10; });
    BOS_KEYWORDS.forEach(word => { if (text.includes(word)) score += 20; });
    TIME_WASTERS.forEach(word => { if (text.includes(word)) score -= 50; });
    ANTIGRAVITY_TECH.forEach(word => { if (text.includes(word)) score += 30; });

    if (extractBudget(text)) score += 20;

    return Math.max(0, Math.min(100, score));
}

export function generatePitch(lead: Omit<Lead, 'score' | 'pitch'>): string {
    const title = lead.title.toLowerCase();
    const desc = lead.description.toLowerCase();
    const budget = lead.extractedBudget || "";

    // Multi-Tier 1: Antigravity Custom AI & Auth Tier
    if (ANTIGRAVITY_TECH.some(w => desc.includes(w) || title.includes(w))) {
        return `Hey! I saw you are looking for help with ${lead.title}. Instead of a standard freelancer, I deploy fully autonomous AI agents and build full-stack web applications on modern architecture (Next.js/Supabase) to execute these processes perfectly. Let me know if you want to jump on a quick call to see my capabilities and how we can fully automate this.`;
    }

    // Multi-Tier 2: High Salary Replacement (The $10k BOS Pitch)
    if (budget.includes('yr') || title.includes('manager') || title.includes('coordinator')) {
        return `Hey! I saw you are looking to hire a full-time ${lead.title} to handle operations and data entry. With benefits and overhead, that role costs you way more than just the base salary.\n\nInstead of paying a person endlessly to do manual spreadsheet work, I build custom Business Operating Systems (BOS). I can fully automate this entire role with custom software for a one-time flat fee (usually < $10k). \n\nYou avoid payroll taxes, bad hires, and delays. Open to a 5-min chat this week to see if I can automate this seat?`;
    }

    // Multi-Tier 2: Specific Hourly Gig Replacement
    if (budget.includes('/hr') || lead.platform.includes('Upwork')) {
        return `Hi there, I saw your post looking for help with ${lead.title}.\n\nInstead of paying an hourly freelancer forever who might ghost you, I build permanent Business Operating Systems (BOS) for a flat fee. I can set up custom automations so this task runs on autopilot permanently. Let me know if you want to jump on a quick call to see my portfolio.`;
    }

    // Multi-Tier 3: The standard Admin/System fix
    if (title.includes('admin') || BOS_KEYWORDS.some(w => desc.includes(w))) {
        return "Hey! I saw your post looking for help with admin work. Instead of just manual labor, I build custom Business Operating Systems (BOS) that automate document prep, client intake, and eliminate messy spreadsheets entirely. I can set this up for you in a few days so your firm runs on autopilot. Open to a quick 5-min chat?";
    }

    // Multi-Tier 4: The Frustration Pitch (Twitter/Social)
    if (lead.platform.includes('Frustration') || desc.includes('hate') || desc.includes('drowning')) {
        return "Saw you posting about fighting with manual data entry. You shouldn't be spending your weekends in spreadsheets. I build custom Business Operating Systems (BOS) for a flat fee that automate all of this so it runs on autopilot forever. Open to a 5-min chat so you can reclaim your time?";
    }

    // Multi-Tier 5: The Startup Pitch (HackerNews/Wellfound)
    if (lead.platform.includes('Startup') || lead.platform.includes('HackerNews')) {
        return `Hey! I saw your startup is hiring for ${lead.title}. Instead of bloating your headcount with an expensive, slow human hire, I can build you a permanent Business Operating System (BOS) for a one-time flat fee. It automates the entire role instantly and scales with you. Let me know if you want to jump on a quick call to see the system.`;
    }

    // Multi-Tier 6: Urgency
    if (URGENCY_WORDS.some(w => desc.includes(w)) && (title.includes('website') || title.includes('python') || title.includes('fix') || title.includes('wordpress'))) {
        return "Hey! I saw this is extremely urgent. I'm a systems engineer and I can jump on this right now and get it fixed/built for you today. Let me know if you want me to start immediately.";
    }

    return "Hi there, I came across your post and I'm highly confident I can execute this perfectly and quickly. I build high-end Business Operating Systems and automations. When are you looking to get this started? I have capacity this week.";
}

export interface FeasibilityAnalysis {
    percentage: number;
    capability: string;
    plan: string[];
    specs: string[];
}

export function generateAntigravityAnalysis(title: string, description: string): FeasibilityAnalysis {
    const text = `${title} ${description}`.toLowerCase();

    // Archetype 1: Heavy Manual Data / Spreadsheets
    if (text.includes('data entry') || text.includes('excel') || text.includes('spreadsheet')) {
        return {
            percentage: 98,
            capability: "Full Data-Layer Automation Possible",
            plan: [
                "Deploy a Supabase relational database to ingest raw CSV/Excel data automatically.",
                "Build a Python/Node.js ingestion script utilizing Pandas for data cleaning.",
                "Connect an API webhook (Make.com/Zapier) to sync the cleaned data directly to their CRM."
            ],
            specs: ["Stack: Python, Supabase, Node.js", "Est. Execution Time: 48 Hours", "Risk Matrix: Low"]
        };
    }

    // Archetype 2: Operations & Admin
    if (text.includes('operations') || text.includes('admin') || text.includes('manager')) {
        return {
            percentage: 85,
            capability: "Workflow & Inbox Automation",
            plan: [
                "Implement a unified communication layer (Twilio/SendGrid) to intercept inbound client requests.",
                "Utilize an LLM routing agent (OpenAI API) to categorize and draft responses to standard inquiries.",
                "Deploy a Next.js admin dashboard for the business owner to monitor the automated actions."
            ],
            specs: ["Stack: Next.js, OpenAI API, Twilio", "Est. Execution Time: 5 Days", "Risk Matrix: Medium"]
        };
    }

    // Archetype 3: Websites / Web Apps
    if (text.includes('website') || text.includes('wordpress') || text.includes('react')) {
        return {
            percentage: 92,
            capability: "Full Stack Replacement",
            plan: [
                "Scrape and extract all existing site assets and copy.",
                "Rebuild the frontend architecture using Next.js and Tailwind CSS for maximum performance.",
                "Connect a headless CMS (Sanity or Supabase) for easy client handoff and content management."
            ],
            specs: ["Stack: Next.js, Vercel, Tailwind", "Est. Execution Time: 72 Hours", "Risk Matrix: Low"]
        };
    }

    // Archetype 4: Default / General Automation
    return {
        percentage: 75,
        capability: "Custom RPA & System Bridging",
        plan: [
            "Conduct a full systems audit to map out their current manual bottlenecks.",
            "Write custom API connectors to bridge their isolated software tools.",
            "Set up an automated reporting cron-job to verify the data integrity daily."
        ],
        specs: ["Stack: Node.js, Vercel Serverless Functions", "Est. Execution Time: 3 Days", "Risk Matrix: Dependent on Client API Access"]
    };
}
