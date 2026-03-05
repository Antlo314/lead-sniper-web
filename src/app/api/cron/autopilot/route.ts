import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
    Lead,
    REDDIT_SOURCES,
    UPWORK_RSS_URL,
    WWR_RSS_URL,
    REMOTE_OK_RSS_URL,
    TWITTER_FRUSTRATION_RSS,
    HACKERNEWS_API_BASE,
    calculateScore,
    generatePitch,
    extractBudget
} from '@/lib/engine';

export async function GET(request: Request) {
    // 1. Authenticate Cron Job (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log("🚀 [Auto-Pilot] Starting background sweep...");

        // 2. Fetch specific high-yield platforms only to save time/compute
        const fetchHackerNews = async (): Promise<Lead[]> => {
            try {
                const res = await fetch(HACKERNEWS_API_BASE);
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
                        score: calculateScore(rawLead.title, rawLead.description) + 15,
                        pitch: generatePitch(rawLead),
                        extractedBudget: extractBudget(cleanDesc)
                    });
                });
                return leads;
            } catch { return []; }
        };

        const fetchUpwork = async (): Promise<Lead[]> => {
            try {
                const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(UPWORK_RSS_URL)}`);
                if (!res.ok) return [];
                const data = await res.json();
                const leads: Lead[] = [];
                data?.items?.forEach((item: any) => {
                    const cleanDesc = item.content.replace(/<[^>]*>?/gm, '');
                    const rawLead = {
                        platform: 'Upwork',
                        title: item.title,
                        description: cleanDesc,
                        link: item.link,
                        published: item.pubDate
                    };
                    leads.push({
                        ...rawLead,
                        score: calculateScore(rawLead.title, rawLead.description),
                        pitch: generatePitch(rawLead),
                        extractedBudget: extractBudget(`${item.title} ${cleanDesc}`)
                    });
                });
                return leads;
            } catch { return []; }
        };

        const fetchFrustration = async (): Promise<Lead[]> => {
            try {
                const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(TWITTER_FRUSTRATION_RSS)}`);
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
                        score: calculateScore(rawLead.title, rawLead.description) + 20,
                        pitch: generatePitch(rawLead)
                    });
                });
                return leads;
            } catch { return []; }
        };

        // 3. Execute concurrently
        const results = await Promise.allSettled([
            fetchHackerNews(),
            fetchUpwork(),
            fetchFrustration()
        ]);

        const allLeads = results
            .filter((r): r is PromiseFulfilledResult<Lead[]> => r.status === 'fulfilled')
            .flatMap(r => r.value);

        // 4. Target Acquired: Filter for God-Tier Leads only (>90 score)
        const godTierLeads = allLeads.filter(l => l.score > 90);
        console.log(`✅ [Auto-Pilot] Sweep complete. Found ${allLeads.length} leads. ${godTierLeads.length} met the >90 threshold.`);

        let insertedCount = 0;

        // 5. Silently Auto-Save to Supabase
        for (const lead of godTierLeads) {
            const { error } = await supabase.from('leads').insert({
                original_link: lead.link,
                title: lead.title,
                description: lead.description,
                platform: lead.platform,
                published: lead.published,
                score: lead.score,
                extracted_budget: lead.extractedBudget || null,
                pitch: lead.pitch,
                stage: 'Saved'
            });

            if (!error) {
                insertedCount++;

                // TODO: Wire up Twilio / SendGrid here to ping the owner immediately.
                // console.log(`🔔 SMS ALERT: High-Ticket Lead Found - ${lead.title}`);
            } else if (error.code !== '23505') {
                // Ignore unique constraint violations (already saved)
                console.error("Supabase insert error:", error.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Auto-Pilot sweep complete. Inserted ${insertedCount} new high-ticket leads.`,
            leadsEvaluated: allLeads.length,
            highValueTargets: godTierLeads.length
        }, { status: 200 });

    } catch (e: any) {
        console.error("Auto-pilot error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
