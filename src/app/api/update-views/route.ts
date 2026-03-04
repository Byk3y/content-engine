import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function PATCH(req: NextRequest) {
    try {
        const { id, views } = await req.json();

        if (!id || typeof views !== 'number') {
            return NextResponse.json({ error: 'id and views (number) are required' }, { status: 400 });
        }

        const { error } = await supabaseServer
            .from('posts')
            .update({ views })
            .eq('id', id);

        if (error) {
            console.error('[update-views] Error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
