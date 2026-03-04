'use client';
import { useState, useEffect } from 'react';
import { Lead, REDDIT_SOURCES, calculateScore, generatePitch, extractBudget } from '@/lib/engine';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Client-side execution using rss2json proxy to bypass Reddit CORS and Vercel IP blocks
      const redditPromises = REDDIT_SOURCES.map(async (subreddit) => {
        try {
          const feedUrl = encodeURIComponent(`https://www.reddit.com/r/${subreddit}/new.rss`);
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;
          const res = await fetch(apiUrl);
          if (!res.ok) return [];
          const data = await res.json();

          const jobs: Lead[] = [];
          data?.items?.forEach((item: any) => {
            const titleLower = item.title.toLowerCase();
            const needsHelp = titleLower.includes('[hiring]') || titleLower.includes('[task]') || titleLower.includes('need help') || titleLower.includes('looking for');

            if (needsHelp && !titleLower.includes('[for hire]')) {
              // Strip HTML formatting from description added by Reddit RSS
              const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
              const textForBudget = `${item.title} ${cleanDesc}`;

              const rawLead = {
                platform: `Reddit (r/${subreddit})`,
                title: item.title,
                description: cleanDesc,
                link: item.link,
                published: item.pubDate
              };
              jobs.push({
                ...rawLead,
                score: calculateScore(rawLead.title, rawLead.description),
                pitch: generatePitch(rawLead),
                extractedBudget: extractBudget(textForBudget)
              });
            }
          });
          return jobs;
        } catch (e) {
          console.error(`Failed ${subreddit}`);
          return [];
        }
      });

      const redditResults = await Promise.all(redditPromises);
      let allLeads = redditResults.flat();
      allLeads = allLeads.sort((a, b) => b.score - a.score).slice(0, 100);
      setLeads(allLeads);
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCopyPitch = (pitch: string, index: number) => {
    navigator.clipboard.writeText(pitch);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 className="title">Urgent Lead Sniper</h1>
          <p className="subtitle">Real-time Desperation & Cash Tracker 📡</p>
        </div>
        <button onClick={fetchLeads} className="primary-btn" disabled={loading}>
          {loading ? 'Siphoning...' : 'Refresh Radars'}
        </button>
      </header>

      {loading ? (
        <div className="empty-state">
          <div className="pulse-ring"></div>
          <p>Siphoning client-side indices (Bypassing blocks)...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <p>No high-intent leads found right now. Check back soon.</p>
        </div>
      ) : (
        <div className="scrolling-grid">
          {leads.map((lead: Lead, index: number) => (
            <div key={index} className="lead-card">
              <div className="card-header">
                <div>
                  <span className={`score-badge ${lead.score >= 80 ? 'urgent' : ''}`}>
                    Score: {lead.score}/100
                  </span>
                  {lead.extractedBudget && (
                    <span className="platform-badge" style={{ marginLeft: '12px', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.4)' }}>
                      💰 {lead.extractedBudget}
                    </span>
                  )}
                </div>
                <span className="platform-badge">{lead.platform}</span>
              </div>

              <h2 className="lead-title">{lead.title}</h2>
              <p className="lead-desc">{lead.description.length > 250 ? lead.description.substring(0, 250) + '...' : lead.description}</p>

              <div className="pitch-section">
                <div className="pitch-header">
                  <strong>Generated Pitch 🚀</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={lead.link} target="_blank" rel="noopener noreferrer" className="secondary-btn">
                      View Post
                    </a>
                    <button
                      onClick={() => handleCopyPitch(lead.pitch, index)}
                      className="primary-btn"
                    >
                      {copiedIndex === index ? 'Copied!' : 'Copy Pitch'}
                    </button>
                  </div>
                </div>
                <div className="pitch-box">
                  {lead.pitch}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
