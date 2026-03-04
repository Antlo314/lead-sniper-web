"use client";

import { useEffect, useState } from 'react';

interface Lead {
  platform: string;
  title: string;
  description: string;
  link: string;
  published: string;
  score: number;
  pitch: string;
  extractedBudget?: string;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyPitch = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🎯 Urgent Lead Sniper</h1>
        <p>Siphoning the noise to find cash-ready clients in real-time.</p>
        <button onClick={fetchLeads} className="btn btn-outline" style={{ marginTop: '20px' }}>
          Refresh Radars
        </button>
      </header>

      {loading ? (
        <div className="loader">Siphoning web indices...</div>
      ) : (
        <main>
          {leads.map((lead, index) => (
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
              <p className="lead-desc">{lead.description.substring(0, 300)}...</p>

              <div className="pitch-container">
                <h4>Generated Pitch Output</h4>
                <p className="pitch-text">"{lead.pitch}"</p>
              </div>

              <div className="action-bar">
                <a href={lead.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  View Original Post
                </a>
                <button
                  onClick={() => copyPitch(lead.pitch, index)}
                  className="btn btn-primary"
                >
                  {copied === index ? 'Copied!' : 'Copy Pitch'}
                </button>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8b949e' }}>No high-intent leads found right now.</div>
          )}
        </main>
      )}
    </div>
  );
}
