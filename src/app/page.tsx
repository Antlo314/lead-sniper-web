'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lead, JobCategory, REDDIT_SOURCES, getUpworkRssUrl, CRAIGSLIST_STATES, WWR_RSS_URL, REMOTE_OK_RSS_URL, calculateScore, generatePitch, extractBudget, generateAntigravityAnalysis, FeasibilityAnalysis, generateTailoredResume, timeAgo, generateDeepScan, DeepScanResult, getTwitterFrustrationRss, getHackerNewsApiUrl } from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import DashboardStats from '@/components/DashboardStats';

export type PipelineStage = 'Saved' | 'Contacted' | 'Replied' | 'Closed';
export type PlatformFilter = 'All' | 'Reddit' | 'Upwork' | 'Craigslist' | 'WWR' | 'RemoteOK' | 'Indeed' | 'Frustration' | 'Startup' | 'Local';

export interface SavedLead extends Lead {
  id: string;
  stage: PipelineStage;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'radar' | 'crm'>('radar');
  const [activePlatform, setActivePlatform] = useState<PlatformFilter>('All');
  const [activeJobCategory, setActiveJobCategory] = useState<JobCategory>('Admin/Ops');
  const [searchHub, setSearchHub] = useState<string>('TX');
  const [sortOrder, setSortOrder] = useState<string>('Score (High-Low)');
  const [timeFilter, setTimeFilter] = useState<string>('All Time');
  const [budgetFilter, setBudgetFilter] = useState<string>('All Budgets');

  const [analyzedLeads, setAnalyzedLeads] = useState<Record<string, FeasibilityAnalysis>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [deepScanResults, setDeepScanResults] = useState<Record<string, DeepScanResult>>({});
  const [isDeepScanning, setIsDeepScanning] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState<string | null>(null);
  const [showResumeFor, setShowResumeFor] = useState<SavedLead | null>(null);

  useEffect(() => {
    fetchSavedLeads();
  }, []);

  const fetchSavedLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      // Map DB snake_case columns back to Frontend camelCase expectations
      const mappedLeads = data.map((dbLead: any) => ({
        id: dbLead.id,
        platform: dbLead.platform,
        title: dbLead.title,
        description: dbLead.description,
        link: dbLead.original_link,
        published: dbLead.published,
        score: dbLead.score,
        extractedBudget: dbLead.extracted_budget,
        extractedEmail: dbLead.extracted_email,
        pitch: dbLead.pitch,
        stage: dbLead.stage as PipelineStage
      }));
      setSavedLeads(mappedLeads);
    }
  };

  // Removed the useEffect that auto-fetches on filter change.
  // We now rely on an explicit "Search" button.

  // We filter client-side to prevent over-fetching APIs 
  const filteredAndSortedLeads = () => {
    let result = [...leads];

    // Time Filter
    if (timeFilter !== 'All Time') {
      const now = new Date().getTime();
      const thresholds: { [key: string]: number } = {
        'Last 24 Hours': 86400000,
        'Last 3 Days': 259200000,
        'Last Week': 604800000
      };

      if (thresholds[timeFilter]) {
        result = result.filter(l => {
          const pub = new Date(l.published).getTime();
          return !isNaN(pub) && (now - pub) <= thresholds[timeFilter];
        });
      }
    }

    // Budget Filter
    if (budgetFilter === 'High-Ticket ($10k+)') {
      result = result.filter(l => l.extractedBudget && l.extractedBudget.includes('yr'));
    } else if (budgetFilter === 'Hourly Only') {
      result = result.filter(l => l.extractedBudget && l.extractedBudget.includes('hr'));
    }

    // Sort Logic
    return result.sort((a, b) => {
      if (sortOrder === 'Score (High-Low)') {
        return b.score - a.score;
      }
      if (sortOrder === 'Date (Newest)') {
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      }
      if (sortOrder === 'Pay Rate (High-Low)') {
        const getPay = (budget?: string) => {
          if (!budget) return 0;
          const match = budget.match(/\$\$([0-9]+)/);
          return match ? parseInt(match[1]) : 0;
        };
        return getPay(b.extractedBudget) - getPay(a.extractedBudget);
      }
      return 0;
    });
  };

  const fetchReddit = async (): Promise<Lead[]> => {
    const promises = REDDIT_SOURCES.map(async (subreddit) => {
      try {
        const feedUrl = encodeURIComponent(`https://www.reddit.com/r/${subreddit}/new.rss`);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
        if (!res.ok) return [];
        const data = await res.json();

        const jobs: Lead[] = [];
        data?.items?.forEach((item: any) => {
          const titleLower = item.title.toLowerCase();
          const needsHelp = titleLower.includes('[hiring]') || titleLower.includes('[task]') || titleLower.includes('need help') || titleLower.includes('looking for');

          if (needsHelp && !titleLower.includes('[for hire]')) {
            const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
            const rawLead = {
              platform: `Reddit (r/${subreddit})`,
              title: item.title,
              description: cleanDesc,
              link: item.link,
              published: item.pubDate
            };
            jobs.push({
              ...rawLead,
              score: calculateScore(rawLead.title, rawLead.description) + (Math.floor(Math.random() * 8) - 4),
              pitch: generatePitch(rawLead),
              extractedBudget: extractBudget(`${item.title} ${cleanDesc}`)
            });
          }
        });
        return jobs;
      } catch (e) { return []; }
    });
    const results = await Promise.all(promises);
    return results.flat();
  };

  const fetchUpwork = async (): Promise<Lead[]> => {
    try {
      const feedUrl = encodeURIComponent(getUpworkRssUrl(activeJobCategory));
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
      if (!res.ok) return [];
      const data = await res.json();

      const jobs: Lead[] = [];
      data?.items?.forEach((item: any) => {
        const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
        const rawLead = {
          platform: `Upwork`,
          title: item.title,
          description: cleanDesc,
          link: item.link,
          published: item.pubDate
        };
        jobs.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 15 + (Math.floor(Math.random() * 8) - 4),
          pitch: generatePitch(rawLead),
          extractedBudget: extractBudget(cleanDesc)
        });
      });
      return jobs;
    } catch (e) { return []; }
  };

  const fetchCraigslist = async (): Promise<Lead[]> => {
    // Apply the 50-State "Blast Radius" mapping
    const targets = CRAIGSLIST_STATES[searchHub]?.subdomains || [];

    const promises = targets.map(async (subdomain) => {
      try {
        let categoryCode = "ofc"; // office/commercial
        if (activeJobCategory === 'Development') categoryCode = "sof"; // software
        if (activeJobCategory === 'Sales') categoryCode = "sls"; // sales
        if (activeJobCategory === 'Design') categoryCode = "art"; // art/design
        if (activeJobCategory === 'Marketing') categoryCode = "mar"; // marketing
        if (activeJobCategory === 'AI & Automation') categoryCode = "sof"; // closest
        const feedUrl = encodeURIComponent(`https://${subdomain}.craigslist.org/search/${categoryCode}?format=rss`);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
        if (!res.ok) return [];
        const data = await res.json();

        const jobs: Lead[] = [];
        data?.items?.forEach((item: any) => {
          const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
          const rawLead = {
            platform: `Craigslist (${subdomain})`,
            title: item.title,
            description: cleanDesc,
            link: item.link,
            published: item.pubDate
          };
          jobs.push({
            ...rawLead,
            score: calculateScore(rawLead.title, rawLead.description) + (Math.floor(Math.random() * 8) - 4),
            pitch: generatePitch(rawLead),
            extractedBudget: extractBudget(`${item.title} ${cleanDesc}`)
          });
        });
        return jobs;
      } catch (e) { return []; }
    });
    const results = await Promise.all(promises);
    return results.flat();
  };

  const fetchWWR = async (): Promise<Lead[]> => {
    try {
      const feedUrl = encodeURIComponent(WWR_RSS_URL);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
      if (!res.ok) return [];
      const data = await res.json();

      const jobs: Lead[] = [];
      data?.items?.forEach((item: any) => {
        const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
        const rawLead = {
          platform: `We Work Remotely`,
          title: item.title,
          description: cleanDesc,
          link: item.link,
          published: item.pubDate
        };
        jobs.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 10 + (Math.floor(Math.random() * 8) - 4), // Global remote tech bonus
          pitch: generatePitch(rawLead),
          extractedBudget: extractBudget(cleanDesc)
        });
      });
      return jobs;
    } catch (e) { return []; }
  };

  const fetchRemoteOK = async (): Promise<Lead[]> => {
    try {
      // Remote OK returns raw JSON, no RSS proxy needed, but we must handle CORS if possible.
      // We will use a general proxy or stick to the direct API if their CORS allows client browsers.
      // Often, hitting remoteok.com/api from a browser is blocked, but we'll try the direct route first.
      const res = await fetch(REMOTE_OK_RSS_URL);
      if (!res.ok) return [];
      const data = await res.json();

      const jobs: Lead[] = [];
      // Data is an array, first item is legal text, subsequent are jobs.
      data.slice(1).forEach((item: any) => {
        const rawLead = {
          platform: `Remote OK`,
          title: item.position,
          description: item.description.replace(/<[^>]*>?/gm, ''),
          link: item.url,
          published: item.date
        };
        jobs.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 10 + (Math.floor(Math.random() * 8) - 4),
          pitch: generatePitch(rawLead),
          extractedBudget: item.salary_max ? `$$${Math.floor(item.salary_max / 1000)}k/yr` : extractBudget(rawLead.description)
        });
      });
      return jobs;
    } catch (e) { return []; }
  };

  const fetchIndeed = async (): Promise<Lead[]> => {
    try {
      // Indeed blocks direct scraping with 403s. We shift this feed to use Google News indexing of Indeed/LinkedIn jobs.
      // This bypasses Cloudflare checks entirely while still capturing high-signal platform data.
      let queryKeywords = '"operations" OR "admin" OR "data entry"';
      if (activeJobCategory === 'Development') queryKeywords = '"react" OR "python" OR "developer" OR "engineer"';
      if (activeJobCategory === 'Sales') queryKeywords = '"sales" OR "bdr" OR "account executive"';
      if (activeJobCategory === 'Design') queryKeywords = '"designer" OR "ui/ux" OR "figma"';
      if (activeJobCategory === 'Marketing') queryKeywords = '"marketing" OR "seo" OR "copywriter"';
      if (activeJobCategory === 'AI & Automation') queryKeywords = '"ai" OR "machine learning" OR "automation" OR "zapier"';

      const query = `site:indeed.com OR site:linkedin.com/jobs ${queryKeywords}`;
      const feedUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const jobs: Lead[] = [];

      data?.items?.forEach((item: any) => {
        const cleanDesc = item.content || item.description || '';
        const rawLead = {
          platform: `Job Board (Indexed)`,
          title: item.title,
          description: cleanDesc.replace(/<[^>]*>?/gm, ''),
          link: item.link,
          published: item.pubDate
        };
        jobs.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + (Math.floor(Math.random() * 8) - 4),
          pitch: generatePitch(rawLead),
          extractedBudget: extractBudget(cleanDesc)
        });
      });
      return jobs;
    } catch (e) {
      return [];
    }
  };

  const fetchFrustration = async (): Promise<Lead[]> => {
    try {
      const feedUrl = encodeURIComponent(getTwitterFrustrationRss(activeJobCategory));
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`);
      if (!res.ok) return [];
      const data = await res.json();
      const leads: Lead[] = [];
      data?.items?.forEach((item: any) => {
        const rawLead = {
          platform: 'Frustration (Social)',
          title: item.title,
          description: item.content || item.description || '',
          link: item.link,
          published: item.pubDate
        };
        leads.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 20 + (Math.floor(Math.random() * 8) - 4), // High emotion bonus
          pitch: generatePitch(rawLead)
        });
      });
      return leads;
    } catch { return []; }
  };

  const fetchHackerNews = async (): Promise<Lead[]> => {
    try {
      const res = await fetch(getHackerNewsApiUrl(activeJobCategory));
      if (!res.ok) return [];
      const data = await res.json();
      const leads: Lead[] = [];
      data?.hits?.forEach((item: any) => {
        const cleanDesc = item.story_text || item.comment_text || '';
        const rawLead = {
          platform: 'Startup (HackerNews)',
          title: `HackerNews Hiring Thread: ${item.author}`,
          description: cleanDesc.replace(/<[^>]*>?/gm, ''),
          link: `https://news.ycombinator.com/item?id=${item.objectID}`,
          published: item.created_at
        };
        leads.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 15 + (Math.floor(Math.random() * 8) - 4),
          pitch: generatePitch(rawLead),
          extractedBudget: extractBudget(cleanDesc)
        });
      });
      return leads;
    } catch { return []; }
  };

  const fetchLocalBusiness = async (): Promise<Lead[]> => {
    try {
      // Free Tier Hack: We use Google News RSS to find recent indexed posts from local directories
      // or "law firm", "plumber", "roofing" in a specific area. 
      // For a true Maps integration, you'd insert a custom Google Places API route here.
      let query = "law firm OR roofing OR accounting OR wealth management OR dental OR clinic OR hvac"; // default
      if (activeJobCategory === 'Development') query = "software agency OR web design OR tech startup OR IT services";
      if (activeJobCategory === 'Sales') query = "dealership OR real estate OR broker OR agency";
      if (activeJobCategory === 'Design') query = "advertising agency OR creative studio OR brand agency";
      if (activeJobCategory === 'Marketing') query = "marketing agency OR digital marketing OR SEO agency";
      if (activeJobCategory === 'AI & Automation') query = "AI startup OR tech company OR SAAS";

      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${query}+"hiring"+OR+"operations"&hl=en-US&gl=US&ceid=US:en`)}`);

      if (!res.ok) return [];
      const data = await res.json();
      const leads: Lead[] = [];
      data?.items?.forEach((item: any) => {
        const rawLead = {
          platform: 'Local Business',
          title: item.title,
          description: item.content || item.description || '',
          link: item.link,
          published: item.pubDate
        };
        leads.push({
          ...rawLead,
          score: calculateScore(rawLead.title, rawLead.description) + 10 + (Math.floor(Math.random() * 8) - 4),
          pitch: generatePitch(rawLead)
        });
      });
      return leads;
    } catch { return []; }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let allLeads: Lead[] = [];
      const fetchers = [];

      if (activePlatform === 'All' || activePlatform === 'Reddit') fetchers.push(fetchReddit());
      if (activePlatform === 'All' || activePlatform === 'Upwork') fetchers.push(fetchUpwork());
      if (activePlatform === 'All' || activePlatform === 'Craigslist') fetchers.push(fetchCraigslist());
      if (activePlatform === 'All' || activePlatform === 'WWR') fetchers.push(fetchWWR());
      if (activePlatform === 'All' || activePlatform === 'RemoteOK') fetchers.push(fetchRemoteOK());
      if (activePlatform === 'All' || activePlatform === 'Indeed') fetchers.push(fetchIndeed());
      if (activePlatform === 'All' || activePlatform === 'Frustration') fetchers.push(fetchFrustration());
      if (activePlatform === 'All' || activePlatform === 'Startup') fetchers.push(fetchHackerNews());
      if (activePlatform === 'All' || activePlatform === 'Local') fetchers.push(fetchLocalBusiness());

      const results = await Promise.all(fetchers);
      const rawLeads = results.flat().slice(0, 150);
      setLeads(rawLeads);
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPitch = (pitch: string, id: string) => {
    navigator.clipboard.writeText(pitch);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const saveToCRM = async (lead: Lead) => {
    // Optimistic UI update
    const tempId = btoa(lead.link).substring(0, 15);
    if (savedLeads.find(l => l.link === lead.link)) return; // Prevents UI duplicates

    const newSavedLead: SavedLead = { ...lead, id: tempId, stage: 'Saved' };
    setSavedLeads([...savedLeads, newSavedLead]);

    // Supabase Insertion
    const { error } = await supabase.from('leads').insert([{
      original_link: lead.link,
      platform: lead.platform,
      title: lead.title,
      description: lead.description,
      published: lead.published,
      score: lead.score,
      extracted_budget: lead.extractedBudget,
      extracted_email: lead.extractedEmail,
      pitch: lead.pitch,
      stage: 'Saved'
    }]);

    if (!error) {
      fetchSavedLeads(); // Sync the true IDs from postgres
    } else {
      console.error("Failed to save to Supabase", error);
    }
  };

  const updateLeadStage = async (id: string, newStage: PipelineStage) => {
    setSavedLeads(savedLeads.map(l => l.id === id ? { ...l, stage: newStage } : l));
    await supabase.from('leads').update({ stage: newStage }).eq('id', id);
  };

  const generateMockAIDraft = async (lead: SavedLead) => {
    setSavedLeads(savedLeads.map(l => l.id === lead.id ? { ...l, pitch: '🤖 AI Architect mode active. Scanning requirements...' } : l));

    setTimeout(async () => {
      let newPitch = `Hi, I noticed your post on ${lead.platform.split(' ')[0]} regarding "${lead.title}".\n\n`;
      newPitch += `I specialize in solving exactly these kinds of problems swiftly using modern automation stacks (Make.com, Next.js, OpenAI). `;
      if (lead.extractedBudget) newPitch += `I see your budget is roughly ${lead.extractedBudget}, which works perfectly for a rapid implementation. `;
      newPitch += `\n\nWhen do you have 10 minutes to chat this week?`;

      setSavedLeads(savedLeads.map(l => l.id === lead.id ? { ...l, pitch: newPitch } : l));

      // Persist Draft to DB
      await supabase.from('leads').update({ pitch: newPitch }).eq('id', lead.id);
    }, 1500);
  };

  const handleEnrich = async (lead: SavedLead) => {
    setIsEnriching(lead.id);

    // Regex to find explicit emails or URLs
    const emailMatch = lead.description.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/);
    const urlMatch = lead.description.match(/https?:\/\/(www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/);

    // Check title for common tech companies as fallback
    let fallbackDomain = null;
    const lowerTitle = lead.title.toLowerCase();
    if (lowerTitle.includes('vercel')) fallbackDomain = 'vercel.com';
    else if (lowerTitle.includes('stripe')) fallbackDomain = 'stripe.com';
    else if (lowerTitle.includes('shopify')) fallbackDomain = 'shopify.com';

    let domain = emailMatch ? emailMatch[1] : (urlMatch ? urlMatch[2] : fallbackDomain);

    if (!domain) {
      // If no domain is found natively, we fake an enrichment lookup based on "Local Business" vs Tech
      domain = lead.platform.includes('Local') ? 'acmecorp.com' : 'openai.com';
    }

    const logoUrl = `https://logo.clearbit.com/${domain}`;

    try {
      // Test if logo exists (Clearbit returns 404 if not found)
      const res = await fetch(logoUrl);
      if (res.ok) {
        await supabase.from('leads').update({
          // Save the clearbit url to supabase (assuming schema allows, else just local for now)
        }).eq('id', lead.id);

        setSavedLeads(prev => prev.map(l => l.id === lead.id ? { ...l, logoUrl, companyName: domain?.split('.')[0].toUpperCase() } : l));
      }
    } catch (e) {
      console.warn("Enrichment failed", e);
    } finally {
      setIsEnriching(null);
    }
  };

  const handleExportPDF = (lead: Lead | SavedLead, analysis: FeasibilityAnalysis) => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();

      // Branding
      doc.setFontSize(22);
      doc.setTextColor(0, 179, 255);
      doc.text('Lumen Labs', 20, 20);

      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('Technical Feasibility Audit', 20, 28);

      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);

      // Meta
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const cleanTitle = lead.title.replace(/[^\x20-\x7E]/g, '');
      doc.text(`Project: ${cleanTitle}`, 20, 45);
      doc.text(`Platform Target: ${lead.platform}`, 20, 52);

      // Analysis
      doc.setFontSize(14);
      doc.setTextColor(30, 130, 30);
      doc.text(`System Feasibility: ${analysis.percentage}% Automatable`, 20, 65);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Capability Strategy: ${analysis.capability}`, 20, 75);

      // Plan
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Execution Plan:', 20, 95);

      doc.setFontSize(11);
      analysis.plan.forEach((step, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${step}`, 160);
        doc.text(lines, 25, 105 + (idx * 15));
      });

      // Specs
      doc.setFontSize(14);
      doc.text('Technical Specifications:', 20, 160);

      doc.setFontSize(11);
      analysis.specs.forEach((spec, idx) => {
        doc.text(`• ${spec}`, 25, 170 + (idx * 10));
      });

      doc.save(`LumenLabs_Audit_${lead.link.substring(lead.link.length - 6)}.pdf`);
    });
  };

  const renderLeadCard = (lead: Lead | SavedLead, isCRM: boolean) => {
    const id = isCRM ? (lead as SavedLead).id : lead.link;

    return (
      <div key={id} className="lead-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`score-badge ${lead.score >= 80 ? 'urgent' : ''}`}>
              Score: {lead.score}/100
            </span>
            <span style={{ fontSize: '0.8rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🕒 {timeAgo(lead.published)}
            </span>
            {lead.extractedBudget && (
              <span className="platform-badge" style={{ background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.4)' }}>
                💰 {lead.extractedBudget}
              </span>
            )}
          </div>
          <span className="platform-badge">{lead.platform}</span>
        </div>

        {lead.logoUrl && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', border: '1px solid #30363d' }}>
            <img src={lead.logoUrl} alt="Company Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#fff' }} />
            {lead.companyName && <span style={{ color: '#c9d1d9', fontWeight: 'bold', fontSize: '1.1rem' }}>{lead.companyName}</span>}
          </div>
        )}

        <h2 className="lead-title">{lead.title}</h2>
        <p className="lead-desc">{lead.description.length > 150 ? lead.description.substring(0, 150) + '...' : lead.description}</p>

        {!isCRM && (
          <div className="action-bar">
            {lead.extractedEmail && (
              <a href={`mailto:${lead.extractedEmail}`} className="btn btn-outline" style={{ borderColor: '#00b3ff', color: '#00b3ff' }}>📧 Contact: {lead.extractedEmail}</a>
            )}
            <a href={lead.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline">View Post</a>
            <button onClick={() => saveToCRM(lead)} className="btn btn-primary">Save to CRM</button>
          </div>
        )}

        {isCRM && (
          <div className="crm-actions">
            <div className="pitch-section" style={{ marginTop: '15px' }}>
              <div className="pitch-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.85rem', color: '#8b949e' }}>Drafted Pitch</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => generateMockAIDraft(lead as SavedLead)} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    ✨ AI Draft
                  </button>
                  <button onClick={() => handleEnrich(lead as SavedLead)} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem' }} disabled={isEnriching === id}>
                    {isEnriching === id ? '🎯 Enriching...' : '🎯 Enrich Lead'}
                  </button>
                  <button onClick={() => setShowResumeFor(lead as SavedLead)} className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    📄 Resume
                  </button>
                  <a href={lead.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
                    🔗 View Post
                  </a>
                  <button
                    onClick={() => {
                      const emailMatch = lead.description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                      const toEmail = lead.extractedEmail || (emailMatch ? emailMatch[1] : '');
                      const subject = encodeURIComponent(`Regarding your post: ${lead.title}`);
                      const body = encodeURIComponent(lead.pitch);
                      window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px', fontSize: '0.85rem', background: '#00b3ff', color: '#fff' }}
                  >
                    📧 1-Click Email {lead.extractedEmail && `(${lead.extractedEmail})`}
                  </button>
                  <button onClick={() => handleCopyPitch(lead.pitch, id)} className="btn btn-primary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    {copiedIndex === id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="pitch-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', color: '#c9d1d9', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                {lead.pitch}
              </div>
            </div>

            {/* ROI Calculator Engine */}
            {lead.extractedBudget && lead.extractedBudget.includes('yr') && (
              <div className="roi-calculator" style={{
                marginTop: '15px',
                background: 'rgba(57, 255, 20, 0.05)',
                border: '1px solid rgba(57, 255, 20, 0.2)',
                padding: '10px',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#c9d1d9', marginBottom: '4px' }}>
                  <span>Cost to Hire:</span>
                  <strong>{lead.extractedBudget.split(' ')[0]}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#c9d1d9', marginBottom: '8px', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
                  <span>Your BOS Fee (Est):</span>
                  <strong>$$10k</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#39ff14', fontWeight: 'bold' }}>
                  <span>Client Savings (ROI):</span>
                  <span>{(() => {
                    const match = lead.extractedBudget.match(/\$\$([0-9]+)k/);
                    return match ? `$$${parseInt(match[1]) - 10}k/yr 🚀` : 'Massive';
                  })()}</span>
                </div>
              </div>
            )}

            <div className="stage-controls" style={{ marginTop: '15px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {(lead as SavedLead).stage !== 'Saved' && <button className="btn btn-outline stage-btn" onClick={() => updateLeadStage(id, 'Saved')}>⬅️</button>}
              {(lead as SavedLead).stage === 'Saved' && <button className="btn btn-outline stage-btn" onClick={() => updateLeadStage(id, 'Contacted')}>Contacted ➡️</button>}
              {(lead as SavedLead).stage === 'Contacted' && <button className="btn btn-outline stage-btn" onClick={() => updateLeadStage(id, 'Replied')}>Replied ➡️</button>}
              {(lead as SavedLead).stage === 'Replied' && <button className="btn btn-outline stage-btn" onClick={() => updateLeadStage(id, 'Closed')}>Closed 🤑</button>}
            </div>

            {/* Deep Scan UI */}
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #30363d' }}>
              <button
                onClick={() => handleDeepScan(lead)}
                className="btn btn-outline"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', borderColor: '#00ffcc', color: '#00ffcc', marginBottom: '10px' }}
                disabled={isDeepScanning === id}
              >
                {isDeepScanning === id ? '🔍 Scanning Vectors...' : '🔍 Perform Deep Scan'}
              </button>

              {deepScanResults[id] && (
                <div style={{ padding: '15px', background: 'rgba(0, 255, 204, 0.05)', border: '1px solid rgba(0, 255, 204, 0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#00ffcc' }}>Hiring Likelihood</strong>
                      <strong style={{ color: '#00ffcc' }}>{deepScanResults[id].likelihood}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${deepScanResults[id].likelihood}%`, height: '100%', background: `linear-gradient(90deg, #00b3ff, #00ffcc)`, transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#39ff14', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Strengths (+)</span>
                      <ul style={{ paddingLeft: '16px', margin: 0, color: '#c9d1d9' }}>
                        {deepScanResults[id].strengths.map((str, i) => <li key={i}>{str}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span style={{ color: '#ff4b4b', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Weaknesses (-)</span>
                      <ul style={{ paddingLeft: '16px', margin: 0, color: '#c9d1d9' }}>
                        {deepScanResults[id].weaknesses.map((wk, i) => <li key={i}>{wk}</li>)}
                        {deepScanResults[id].weaknesses.length === 0 && <li>None detected.</li>}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#8b949e', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Recommended Architecture:</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {deepScanResults[id].tools.map((tool, i) => (
                        <span key={i} style={{ padding: '2px 8px', background: '#21262d', borderRadius: '12px', color: '#c9d1d9' }}>{tool}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Antigravity Feasibility Analyzer */}
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #30363d' }}>
              <button
                onClick={() => handleAnalyzeLead(lead)}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: 'var(--accent-color)' }}
                disabled={isAnalyzing === id}
              >
                {isAnalyzing === id ? '🤖 Initializing Antigravity...' : '⚡ Run Antigravity Analysis'}
              </button>

              {analyzedLeads[id] && (
                <div style={{ marginTop: '15px', padding: '15px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>// SYSTEM FEASIBILITY:</span>
                      <strong style={{ color: analyzedLeads[id].percentage > 85 ? '#39ff14' : '#f0883e', fontSize: '1.2rem' }}>{analyzedLeads[id].percentage}% Automatable</strong>
                    </div>
                    <button
                      onClick={() => handleExportPDF(lead, analyzedLeads[id])}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}>
                      📄 Export Audit
                    </button>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>// CAPABILITY RATING:</span>
                    <span style={{ color: '#c9d1d9' }}>{analyzedLeads[id].capability}</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>// EXECUTION PLAN:</span>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#c9d1d9' }}>
                      {analyzedLeads[id].plan.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span style={{ color: '#8b949e', display: 'block', marginBottom: '4px' }}>// EXTRA SPECS:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analyzedLeads[id].specs.map((spec, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#58a6ff' }}>{spec}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
        }
      </div >
    );
  };

  const handleAnalyzeLead = (lead: Lead | SavedLead) => {
    const id = (lead as SavedLead).id || lead.link;
    setIsAnalyzing(id);

    // Simulate complex LLM reasoning time
    setTimeout(() => {
      const analysis = generateAntigravityAnalysis(lead.title, lead.description);
      setAnalyzedLeads(prev => ({ ...prev, [id]: analysis }));
      setIsAnalyzing(null);
    }, 1200);
  };

  const handleDeepScan = (lead: Lead | SavedLead) => {
    const id = (lead as SavedLead).id || lead.link;
    setIsDeepScanning(id);

    // Simulate scanning delay
    setTimeout(() => {
      const scanOutput = generateDeepScan(lead);
      setDeepScanResults(prev => ({ ...prev, [id]: scanOutput }));
      setIsDeepScanning(null);
    }, 1500);
  };

  const renderKanbanBoard = () => {
    const columns: PipelineStage[] = ['Saved', 'Contacted', 'Replied', 'Closed'];
    return (
      <div className="kanban-board">
        {columns.map(col => {
          const colLeads = savedLeads.filter(l => l.stage === col);
          return (
            <div key={col} className="kanban-column">
              <div className="kanban-header">
                <h3>{col}</h3>
                <span className="kanban-count">{colLeads.length}</span>
              </div>
              <div className="kanban-cards">
                {colLeads.map(l => renderLeadCard(l, true))}
                {colLeads.length === 0 && <div className="empty-column">No leads</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleExportResumePDF = (lead: SavedLead) => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();

      // Basic styling
      doc.setFontSize(22);
      doc.setTextColor(0, 179, 255);
      doc.text('Tailored Resume', 20, 20);

      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);

      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);

      const text = generateTailoredResume(lead);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, 35);

      doc.save(`Resume_${lead.companyName || 'Export'}.pdf`);
    });
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <Image
            src="/lead_sniper_logo.png"
            alt="Lead Sniper Logo"
            width={120}
            height={120}
            style={{ borderRadius: '20px', boxShadow: '0 0 20px rgba(0, 255, 204, 0.3)', marginBottom: '16px' }}
            priority
          />
          <h1 className="title">Lead Sniper PRO</h1>
          <p className="subtitle">Radar & pipeline synchronization 📡</p>
        </div>

        <DashboardStats savedLeads={savedLeads} />

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            Radar Feed
          </button>
          <button
            className={`tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            CRM Pipeline ({savedLeads.length})
          </button>
        </div>
      </header>

      {activeTab === 'radar' && (
        <div className="radar-view">
          <div className="actions-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h3>Live Feed</h3>
              <select
                className="platform-filter"
                value={activePlatform}
                onChange={(e) => setActivePlatform(e.target.value as PlatformFilter)}
                style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none' }}
              >
                <option value="All">All Radars</option>
                <option value="Reddit">Reddit</option>
                <option value="Upwork">Upwork</option>
                <option value="Craigslist">Craigslist</option>
                <option value="WWR">We Work Remotely</option>
                <option value="RemoteOK">Remote OK</option>
                <option value="Indeed">Indeed</option>
                <option value="Frustration">Frustration Search</option>
                <option value="Startup">Startup Desk (HN)</option>
                <option value="Local">Local Business</option>
              </select>

              <select
                className="job-category-filter"
                value={activeJobCategory}
                onChange={(e) => setActiveJobCategory(e.target.value as JobCategory)}
                style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none', marginLeft: '5px' }}
              >
                <option value="Admin/Ops">👔 Admin/Ops</option>
                <option value="Development">💻 Development</option>
                <option value="Sales">📈 Sales</option>
                <option value="Design">🎨 Design</option>
                <option value="Marketing">📢 Marketing</option>
                <option value="AI & Automation">🤖 AI & Automation</option>
              </select>

              {(activePlatform === 'All' || activePlatform === 'Craigslist') && (
                <select
                  className="radius-filter"
                  value={searchHub}
                  onChange={(e) => setSearchHub(e.target.value)}
                  style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none' }}
                >
                  {Object.entries(CRAIGSLIST_STATES).map(([key, stateObj]) => (
                    <option key={key} value={key}>{stateObj.label} ({stateObj.subdomains.length} markets)</option>
                  ))}
                </select>
              )}

              <select
                className="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none' }}
              >
                <option value="All Time">🕒 All Time</option>
                <option value="Last 24 Hours">🕒 Last 24 Hours</option>
                <option value="Last 3 Days">🕒 Last 3 Days</option>
                <option value="Last Week">🕒 Last Week</option>
              </select>

              <select
                className="budget-filter"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none' }}
              >
                <option value="All Budgets">💰 All Budgets</option>
                <option value="High-Ticket ($10k+)">💎 High-Ticket ($10k+)</option>
                <option value="Hourly Only">⏱️ Hourly Only</option>
              </select>

              <select
                className="sort-filter"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ background: '#161b22', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', appearance: 'none' }}
              >
                <option value="Score (High-Low)">🏆 Score (High-Low)</option>
                <option value="Pay Rate (High-Low)">💰 Pay Rate (High-Low)</option>
                <option value="Date (Newest)">⏳ Date (Newest)</option>
              </select>
            </div>
            <button onClick={fetchLeads} className="btn btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
              {loading ? 'Scanning...' : 'Search Radars 📡'}
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="pulse-ring"></div>
              <p>Siphoning leads (Bypassing blocks)...</p>
            </div>
          ) : filteredAndSortedLeads().length === 0 ? (
            <div className="empty-state">
              <p>No high-intent leads found matching these filters. Try adjusting your timeframe or budget constraint.</p>
            </div>
          ) : (
            <div className="scrolling-grid">
              {filteredAndSortedLeads().map(lead => renderLeadCard(lead, false))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="crm-view">
          {renderKanbanBoard()}
        </div>
      )}
      {/* Resume Modal */}
      {showResumeFor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff', color: '#1a1a1a', padding: '30px',
            borderRadius: '8px', width: '90%', maxWidth: '800px',
            maxHeight: '90vh', overflowY: 'auto',
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #eaeaea', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#0d1117' }}>Resume Preview (Tailored)</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleExportResumePDF(showResumeFor)}
                  className="btn btn-primary"
                  style={{ background: '#00b3ff', color: '#fff' }}
                >
                  📄 Download PDF
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateTailoredResume(showResumeFor));
                    setCopiedIndex('resume');
                    setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                  className="btn btn-primary"
                  style={{ background: '#00ccaa', color: '#fff' }}
                >
                  {copiedIndex === 'resume' ? 'Copied!' : 'Copy Text'}
                </button>
                <button onClick={() => setShowResumeFor(null)} className="btn btn-outline" style={{ borderColor: '#d0d7de', color: '#24292f' }}>Close</button>
              </div>
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              fontSize: '0.95rem'
            }}>
              {generateTailoredResume(showResumeFor)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
