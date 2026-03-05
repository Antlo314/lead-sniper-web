'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SavedLead } from '@/app/page';

interface DashboardStatsProps {
    savedLeads: SavedLead[];
}

const COLORS = ['#00ffcc', '#00b3ff', '#39ff14', '#f0883e', '#8b949e', '#ff4b4b'];

export default function DashboardStats({ savedLeads }: DashboardStatsProps) {
    // 1. Calculate Pipeline Value ($10k per active lead)
    const activeLeads = savedLeads.filter(l => l.stage === 'Contacted' || l.stage === 'Replied');
    const pipelineValue = activeLeads.length * 10000;

    // 2. Calculate Win Rate
    const closedLeads = savedLeads.filter(l => l.stage === 'Closed').length;
    const contactedOrMore = savedLeads.filter(l => l.stage !== 'Saved').length;
    const winRate = contactedOrMore > 0 ? ((closedLeads / contactedOrMore) * 100).toFixed(1) : '0.0';

    // 3. Platform Distribution
    const platformCounts: Record<string, number> = {};
    savedLeads.forEach(lead => {
        // Simplify platform names for chart
        let p = lead.platform.split(' ')[0];
        if (p === 'Job') p = 'Indeed';
        if (p === 'Frustration') p = 'Twitter';
        platformCounts[p] = (platformCounts[p] || 0) + 1;
    });

    const chartData = Object.keys(platformCounts).map(key => ({
        name: key,
        value: platformCounts[key]
    })).sort((a, b) => b.value - a.value);

    return (
        <div className="dashboard-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            background: 'rgba(13, 17, 23, 0.6)',
            border: '1px solid rgba(0, 255, 204, 0.2)',
            borderRadius: '12px',
            padding: '24px'
        }}>
            <div className="stat-card" style={{ background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h4 style={{ color: '#8b949e', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Pipeline Value</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#39ff14' }}>
                    ${pipelineValue.toLocaleString()}
                </div>
                <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: '10px 0 0 0' }}>Est. $10k BOS Fee per active lead</p>
            </div>

            <div className="stat-card" style={{ background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h4 style={{ color: '#8b949e', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Win Rate (Closed)</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00ffcc' }}>
                    {winRate}%
                </div>
                <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: '10px 0 0 0' }}>Across {contactedOrMore} contacted leads</p>
            </div>

            <div className="stat-card" style={{ background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d', minHeight: '180px' }}>
                <h4 style={{ color: '#8b949e', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Lead Sources</h4>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: '120px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={30}
                                    outerRadius={50}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9' }}
                                    itemStyle={{ color: '#00ffcc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ color: '#484f58', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
                        No leads saved yet.
                    </div>
                )}
            </div>
        </div>
    );
}
