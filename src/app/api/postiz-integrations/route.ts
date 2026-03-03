import { NextResponse } from 'next/server';

const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY;

export async function GET() {
    try {
        console.log('[postiz-integrations] POSTIZ_API_KEY defined:', POSTIZ_API_KEY ? 'YES' : 'UNDEFINED');

        if (!POSTIZ_API_KEY) {
            throw new Error('POSTIZ_API_KEY is not configured');
        }

        const url = 'https://api.postiz.com/public/v1/integrations';
        console.log('[postiz-integrations] Fetching:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': POSTIZ_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        console.log('[postiz-integrations] Response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[postiz-integrations] Error body:', errorBody);
            throw new Error(`Postiz API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        console.log('[postiz-integrations] Raw API response:', JSON.stringify(data));

        // Filter for TikTok integrations only
        const tiktokIntegrations = (Array.isArray(data) ? data : data.integrations || [])
            .filter((integration: any) => integration.identifier === 'tiktok')
            .map((integration: any) => ({
                id: integration.id,
                name: integration.name || integration.providerIdentifier || 'TikTok',
                picture: integration.picture || integration.profile?.picture || null,
                identifier: integration.identifier,
            }));

        console.log('[postiz-integrations] Filtered TikTok result:', JSON.stringify(tiktokIntegrations));

        return NextResponse.json({ integrations: tiktokIntegrations });
    } catch (error: any) {
        console.error('[postiz-integrations] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
