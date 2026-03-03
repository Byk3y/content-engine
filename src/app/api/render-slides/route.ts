import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use the legacy JWT anon key for storage operations (publishable keys don't support storage)
const supabaseStorage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Separate client for DB queries (works with publishable key)
const supabaseDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 aspect ratio

async function getBufferFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function generateTextSvg(text: string | null | undefined, isHook: boolean, imageSource: string, assetTag?: string) {
    if (!text || text.trim() === '') {
        return Buffer.from(`
            <svg width="${WIDTH}" height="${HEIGHT}" viewbox="0 0 ${WIDTH} ${HEIGHT}">
                <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
            </svg>
        `);
    }

    const isCTA = assetTag === 'cta';
    const isLibrary = imageSource === 'library';

    // 1. Font Setting & Dynamic Sizing
    const words = text.trim().split(/\s+/);
    let fontSize = words.length > 8 ? 46 : 58;

    // Override for CTA to fit safely at bottom
    if (isCTA) {
        fontSize = 44;
    }

    // 2. Word wrapping logic (Maximum 88% width wrap max)
    const lines: string[] = [];
    let currentLine = '';
    // Approximate character limits based on 88% width (approx 950px)
    // 58px ~ 25 chars, 46px ~ 32 chars, 44px ~ 34 chars
    const maxChars = fontSize === 58 ? 25 : (fontSize === 46 ? 32 : 34);

    words.forEach(word => {
        if ((currentLine + word).length > maxChars) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    if (currentLine.trim()) lines.push(currentLine.trim());

    // 3. Vertical Positioning
    const lineHeight = fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;

    // Default: Center
    let startY = (HEIGHT - totalHeight) / 2;

    if (isCTA) {
        // Very bottom, inside 120px safe zone
        startY = HEIGHT - 120 - totalHeight;
    } else if (isLibrary) {
        // Bottom portion, avoiding pet name/progress bar
        startY = HEIGHT - 350 - totalHeight;
    }

    // 4. Color Accent (Orange on last 2-3 words of hook)
    let totalWordCount = 0;
    const styledLines = lines.map((line, i) => {
        if (!isHook) return line; // White text only

        const lineWords = line.split(' ');
        const styledLineWords = lineWords.map(word => {
            totalWordCount++;
            // If we are in the last 3 words of the total text, make it orange
            if (totalWordCount > words.length - 3) {
                return `<tspan fill="#FF9500">${word}</tspan>`;
            }
            return word;
        });
        return styledLineWords.join(' ');
    });

    // 5. TikTok-Native Style: Arial Rounded MT Bold, white text, 3px black stroke, drop shadow
    const textContent = styledLines.map((line, i) => `
    <text 
      x="50%" 
      y="${startY + (i * lineHeight) + fontSize}" 
      text-anchor="middle" 
      fill="#FFFFFF" 
      font-family="'Arial Rounded MT Bold', 'Arial Bold', Arial, sans-serif" 
      font-weight="bold" 
      font-size="${fontSize}px"
      stroke="#000000"
      stroke-width="3"
      stroke-linejoin="round"
      style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.5));"
    >${line}</text>
  `).join('');

    return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewbox="0 0 ${WIDTH} ${HEIGHT}">
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
      ${textContent}
    </svg>
  `);
}

export async function POST(req: NextRequest) {
    try {
        const { slides, hookText } = await req.json();

        if (!slides || !Array.isArray(slides)) {
            return NextResponse.json({ error: 'Invalid slides data' }, { status: 400 });
        }

        // Generate a unique batch ID for this render session
        const batchId = randomUUID().split('-')[0]; // Short 8-char ID like "a1b2c3d4"
        console.log(`[render-slides] Starting render batch: ${batchId} (${slides.length} slides)`);

        const renderedSlides = await Promise.all(slides.map(async (slide: any) => {
            let imageBuffer: Buffer;

            if (slide.image_source === 'library') {
                const { data: assets, error } = await supabaseDb
                    .from('assets')
                    .select('storage_url')
                    .eq('tag', slide.asset_tag)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error || !assets || assets.length === 0) {
                    // Fallback to a placeholder if no asset found
                    imageBuffer = await sharp({
                        create: {
                            width: WIDTH,
                            height: HEIGHT,
                            channels: 4,
                            background: { r: 30, g: 30, b: 30, alpha: 1 }
                        }
                    }).png().toBuffer();
                } else {
                    imageBuffer = await getBufferFromUrl(assets[0].storage_url);
                }
            } else {
                // AI Generate — calls generate-image Edge Function
                const funcResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ prompt: slide.image_prompt })
                });

                const funcData = await funcResponse.json();
                if (funcData.error) throw new Error(funcData.error);

                const dataUrl = funcData.image_data_url;
                if (!dataUrl) throw new Error('No image_data_url in generate-image response');
                const base64Data = dataUrl.split(',')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
            }

            // Process with Sharp
            const processed = await sharp(imageBuffer)
                .resize(WIDTH, HEIGHT, {
                    fit: 'cover',
                    position: 'center'
                })
                .composite([
                    {
                        input: Buffer.from(`<svg><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="rgba(0,0,0,0.3)"/></svg>`),
                        blend: 'over'
                    },
                    {
                        input: generateTextSvg(
                            slide.slide_number === 1 ? hookText : slide.text_overlay,
                            slide.slide_number === 1,
                            slide.image_source,
                            slide.asset_tag
                        ),
                        blend: 'over'
                    }
                ])
                .jpeg({ quality: 85 })
                .toBuffer();

            // Upload to Supabase Storage with batch-based path
            const fileName = `rendered/${batchId}/slide-${slide.slide_number}.jpg`;

            console.log(`[render-slides] Uploading slide ${slide.slide_number} → ${fileName} (${processed.length} bytes)`);

            const { error: uploadError } = await supabaseStorage.storage
                .from('content-assets')
                .upload(fileName, processed, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error(`[render-slides] ❌ Upload failed for slide ${slide.slide_number}:`, uploadError.message);
                throw new Error(`Storage upload failed for slide ${slide.slide_number}: ${uploadError.message}`);
            }

            const { data: publicUrlData } = supabaseStorage.storage
                .from('content-assets')
                .getPublicUrl(fileName);

            console.log(`[render-slides] ✅ Slide ${slide.slide_number} uploaded → ${publicUrlData.publicUrl}`);

            return {
                slide_number: slide.slide_number,
                url: publicUrlData.publicUrl
            };
        }));

        console.log(`[render-slides] ✅ Batch ${batchId} complete — ${renderedSlides.length} slides rendered and stored`);

        return NextResponse.json({ slides: renderedSlides, batchId });

    } catch (error: any) {
        console.error('[render-slides] ❌ Render error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
