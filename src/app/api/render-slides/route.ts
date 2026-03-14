import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import satori from 'satori';
import { join } from 'path';
import { readFile } from 'fs/promises';

let bebasFont: ArrayBuffer | Buffer | null = null;
let interFont: ArrayBuffer | Buffer | null = null;

async function loadFonts() {
    if (!bebasFont) {
        bebasFont = await readFile(join(process.cwd(), 'public/fonts/BebasNeue-Regular.ttf'));
    }
    if (!interFont) {
        interFont = await readFile(join(process.cwd(), 'public/fonts/inter-latin-600-normal.woff'));
    }
}

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

async function uploadWithRetry(fileName: string, buffer: Buffer, retries = 3) {
    let lastError: any = null;
    // Next.js fetch polyfill handles native ArrayBuffers better than Node Buffers under concurrency
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const { error } = await supabaseStorage.storage
                .from('content-assets')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });
            if (!error) return { error: null };
            lastError = error;
            console.warn(`[render-slides] ⚠️ Upload attempt ${attempt} failed for ${fileName}:`, error.message);
        } catch (err: any) {
            lastError = err;
            console.warn(`[render-slides] ⚠️ Upload attempt ${attempt} threw for ${fileName}:`, err.message);
        }
        if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
    return { error: lastError };
}

async function generateTextSvg(text: string | null | undefined, isHook: boolean, imageSource: string, assetTag?: string) {
    if (!text || text.trim() === '') {
        return Buffer.from(`
            <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
                <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
            </svg>
        `);
    }

    await loadFonts();

    // 1. ALL CAPS
    const capsText = text.trim().toUpperCase();
    const words = capsText.split(/\s+/);

    // 2. Font size: 100px for hook slide, 80px for all other slides
    let fontSize = isHook ? 100 : 80;

    // 3. Word wrapping (88% max width)
    const MAX_TEXT_WIDTH = Math.floor(WIDTH * 0.88); // 88% of image width = 950px
    const CHAR_WIDTH_FACTOR = 0.55; // Bebas Neue is narrow

    function wrapText(size: number): string[] {
        const charWidth = size * CHAR_WIDTH_FACTOR;
        const maxChars = Math.floor(MAX_TEXT_WIDTH / charWidth);
        const wrapped: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length > 0 && (currentLine + ' ' + word).length > maxChars) {
                wrapped.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
            }
        });
        if (currentLine) wrapped.push(currentLine);
        return wrapped;
    }

    let lines = wrapText(fontSize);

    // 4. Auto-shrink: if more than 3 lines, reduce font size by 8px and re-wrap
    while (lines.length > 3 && fontSize > 40) {
        fontSize -= 8;
        lines = wrapText(fontSize);
    }

    const paddingH = 36;
    const paddingV = 20;
    const mt = assetTag === 'cta' ? 340 : 0;

    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                children: {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isHook ? 'rgba(0,0,0,0.55)' : 'transparent',
                            borderRadius: '24px',
                            padding: `${paddingV}px ${paddingH}px`,
                            marginTop: `${mt}px`,
                        },
                        children: lines.map((line) => ({
                            type: 'span',
                            props: {
                                style: {
                                    fontFamily: '"Bebas Neue"',
                                    fontSize: fontSize,
                                    lineHeight: '1.3',
                                    fontWeight: 400,
                                    color: '#FFFFFF',
                                    textShadow: '0px 3px 6px rgba(0,0,0,0.6)',
                                    WebkitTextStroke: '4px #000000',
                                    paintOrder: 'stroke',
                                },
                                children: line
                            }
                        }))
                    }
                }
            },
        } as any,
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                {
                    name: 'Bebas Neue',
                    data: bebasFont as ArrayBuffer,
                    weight: 400,
                    style: 'normal',
                }
            ]
        }
    );

    return Buffer.from(svg);
}

async function generateTipsCardSvg(rating: string, methodName: string, subtext: string) {
    await loadFonts();

    const ratingText = rating.toUpperCase();
    const methodText = methodName.toUpperCase();

    let methodFontSize = 110;
    if (methodText.length > 20) {
        methodFontSize = 76;
    } else if (methodText.length > 14) {
        methodFontSize = 90;
    }

    const ratingY = Math.floor(HEIGHT * 0.33);

    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    paddingTop: `${ratingY}px`,
                },
                children: [
                    {
                        type: 'span',
                        props: {
                            style: {
                                fontFamily: '"Bebas Neue"',
                                fontSize: 160,
                                fontWeight: 400,
                                color: '#FF6B35',
                                lineHeight: '1',
                            },
                            children: ratingText
                        }
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: '70px',
                                maxWidth: '864px',
                            },
                            children: {
                                type: 'span',
                                props: {
                                    style: {
                                        fontFamily: '"Bebas Neue"',
                                        fontSize: methodFontSize,
                                        fontWeight: 400,
                                        color: '#FFFFFF',
                                        textAlign: 'center',
                                        lineHeight: '1.2',
                                    },
                                    children: methodText
                                }
                            }
                        }
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: '60px',
                                maxWidth: '850px',
                            },
                            children: {
                                type: 'span',
                                props: {
                                    style: {
                                        fontFamily: '"Inter"',
                                        fontSize: 52,
                                        fontWeight: 600,
                                        color: '#AAAAAA',
                                        textAlign: 'center',
                                        lineHeight: '1.4',
                                    },
                                    children: subtext
                                }
                            }
                        }
                    }
                ]
            }
        } as any,
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                {
                    name: 'Bebas Neue',
                    data: bebasFont as ArrayBuffer,
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: interFont as ArrayBuffer,
                    weight: 600,
                    style: 'normal',
                }
            ],
        }
    );

    return Buffer.from(svg);
}

export async function POST(req: NextRequest) {
    try {
        const { slides, hookText, character } = await req.json();

        if (!slides || !Array.isArray(slides)) {
            return NextResponse.json({ error: 'Invalid slides data' }, { status: 400 });
        }

        // Generate a unique batch ID for this render session
        const batchId = randomUUID().split('-')[0]; // Short 8-char ID like "a1b2c3d4"
        console.log(`[render-slides] Starting render batch: ${batchId} (${slides.length} slides)`);

        const renderedSlides = await Promise.all(slides.map(async (slide: any) => {
            let imageBuffer: Buffer;

            if (slide.image_source === 'tips_card') {
                // ─── Tips Card: fetch template + composite three text layers ───
                const { data: assets, error } = await supabaseDb
                    .from('assets')
                    .select('storage_url')
                    .eq('tag', 'tips_card')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error || !assets || assets.length === 0) {
                    // Fallback to a dark placeholder
                    imageBuffer = await sharp({
                        create: {
                            width: WIDTH,
                            height: HEIGHT,
                            channels: 4,
                            background: { r: 20, g: 20, b: 25, alpha: 1 }
                        }
                    }).png().toBuffer();
                } else {
                    imageBuffer = await getBufferFromUrl(assets[0].storage_url);
                }

                // Resize base template to target dimensions
                const resizedBase = await sharp(imageBuffer)
                    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
                    .png()
                    .toBuffer();

                // Composite the three-layer tips card SVG
                const tipsOverlay = await generateTipsCardSvg(
                    slide.rating || '?/10',
                    slide.text_overlay || 'METHOD',
                    slide.subtext || ''
                );

                const processed = await sharp(resizedBase)
                    .composite([{ input: tipsOverlay, blend: 'over' }])
                    .jpeg({ quality: 85 })
                    .toBuffer();

                // Upload to Supabase Storage
                const fileName = `rendered/${batchId}/slide-${slide.slide_number}.jpg`;
                console.log(`[render-slides] Uploading tips_card slide ${slide.slide_number} → ${fileName} (${processed.length} bytes)`);

                const { error: uploadError } = await uploadWithRetry(fileName, processed);

                if (uploadError) {
                    console.error(`[render-slides] ❌ Upload failed for slide ${slide.slide_number} after retries:`, uploadError?.message || uploadError);
                    throw new Error(`Storage upload failed for slide ${slide.slide_number}: ${uploadError?.message || uploadError}`);
                }

                const { data: publicUrlData } = supabaseStorage.storage
                    .from('content-assets')
                    .getPublicUrl(fileName);

                console.log(`[render-slides] ✅ Slide ${slide.slide_number} (tips_card) uploaded → ${publicUrlData.publicUrl}`);

                return {
                    slide_number: slide.slide_number,
                    url: publicUrlData.publicUrl
                };

            } else if (slide.image_source === 'library') {
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
                const finalPrompt = character
                    ? `${character}. ${slide.image_prompt}`
                    : slide.image_prompt;
                const funcResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ prompt: finalPrompt })
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
                        input: await generateTextSvg(
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

            const { error: uploadError } = await uploadWithRetry(fileName, processed);

            if (uploadError) {
                console.error(`[render-slides] ❌ Upload failed for slide ${slide.slide_number} after retries:`, uploadError?.message || uploadError);
                throw new Error(`Storage upload failed for slide ${slide.slide_number}: ${uploadError?.message || uploadError}`);
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
