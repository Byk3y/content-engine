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

        // Return ALL supported integrations (TikTok + Instagram)
        const SUPPORTED_IDENTIFIERS = ['tiktok', 'instagram-standalone'];

        const allIntegrations = (Array.isArray(data) ? data : data.integrations || [])
            .filter((integration: any) => SUPPORTED_IDENTIFIERS.includes(integration.identifier))
            .map((integration: any) => ({
                id: integration.id,
                name: integration.name || integration.providerIdentifier || integration.identifier,
                picture: integration.picture || integration.profile?.picture || null,
                identifier: integration.identifier,
            }));

        console.log('[postiz-integrations] Filtered integrations:', JSON.stringify(allIntegrations));

        return NextResponse.json({ integrations: allIntegrations });
    } catch (error: any) {
        console.error('[postiz-integrations] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
