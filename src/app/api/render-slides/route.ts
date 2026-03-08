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
            <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
                <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
            </svg>
        `);
    }

    const MAX_TEXT_WIDTH = Math.floor(WIDTH * 0.75); // 75% of image width = 810px
    const CHAR_WIDTH_FACTOR = 0.55; // Bebas Neue is narrow

    // 1. ALL CAPS
    const capsText = text.trim().toUpperCase();
    const words = capsText.split(/\s+/);

    // 2. Font size: 72px for hook slide, 44px for all other slides
    let fontSize = isHook ? 72 : 44;

    // 3. Word wrapping (75% max width)
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

    // 4. Auto-shrink: if more than 2 lines, reduce font size by 10px and re-wrap
    if (lines.length > 2) {
        fontSize -= 10;
        lines = wrapText(fontSize);
    }

    // 5. Measurements for pill background
    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;
    const paddingH = 32; // 32px horizontal padding inside pill
    const paddingV = 14; // vertical padding
    const pillHeight = totalTextHeight + (paddingV * 2);
    const borderRadius = 24;

    // Pill width wraps to the longest line, not the full max width
    const longestLineChars = Math.max(...lines.map(l => l.length));
    const longestLineWidth = longestLineChars * fontSize * CHAR_WIDTH_FACTOR;
    const pillWidth = Math.min(longestLineWidth + (paddingH * 2), MAX_TEXT_WIDTH + (paddingH * 2));

    // 6. Vertical positioning — always center
    const pillY = (HEIGHT - pillHeight) / 2;

    // Horizontally centre the pill on the canvas
    const pillX = (WIDTH - pillWidth) / 2;
    const textStartY = pillY + paddingV;

    // 7. Build SVG
    const textElements = lines.map((line, i) => `
    <text 
      x="50%" 
      y="${textStartY + (i * lineHeight) + fontSize}" 
      text-anchor="middle" 
      fill="#FFFFFF" 
      font-family="'Bebas Neue', 'Arial Black', Impact, sans-serif" 
      font-weight="bold" 
      font-size="${fontSize}px"
      stroke="#000000"
      stroke-width="4"
      stroke-linejoin="round"
      paint-order="stroke"
      style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.6));"
    >${line}</text>
  `).join('');

    return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
      ${isHook ? `<rect
        x="${pillX}"
        y="${pillY}"
        width="${pillWidth}"
        height="${pillHeight}"
        rx="${borderRadius}"
        ry="${borderRadius}"
        fill="rgba(0,0,0,0.55)"
      />` : ''}
      ${textElements}
    </svg>
  `);
}

function generateTipsCardSvg(rating: string, methodName: string, subtext: string) {
    const CHAR_WIDTH_NARROW = 0.55; // Bebas Neue narrow chars
    const CHAR_WIDTH_NORMAL = 0.5; // Arial normal chars

    // Escape XML special characters
    const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Layer 1 — Rating (orange, 120px, at 35% from top)
    const ratingText = rating.toUpperCase();
    const ratingFontSize = 120;
    const ratingY = Math.floor(HEIGHT * 0.35);

    // Layer 2 — Method name (white, adaptive font size, word-wrapped at 80% width)
    const methodText = methodName.toUpperCase();
    const methodMaxWidth = Math.floor(WIDTH * 0.80); // 864px on 1080 canvas

    // Adaptive font size based on character count
    let methodFontSize = 88;
    if (methodText.length > 20) {
        methodFontSize = 56;
    } else if (methodText.length > 14) {
        methodFontSize = 68;
    }

    // Word-wrap method name at max width
    const methodCharWidth = methodFontSize * CHAR_WIDTH_NARROW;
    const methodMaxChars = Math.floor(methodMaxWidth / methodCharWidth);
    const methodWords = methodText.split(/\s+/);
    const methodLines: string[] = [];
    let methodCurrentLine = '';
    methodWords.forEach(word => {
        if (methodCurrentLine.length > 0 && (methodCurrentLine + ' ' + word).length > methodMaxChars) {
            methodLines.push(methodCurrentLine);
            methodCurrentLine = word;
        } else {
            methodCurrentLine = methodCurrentLine.length > 0 ? methodCurrentLine + ' ' + word : word;
        }
    });
    if (methodCurrentLine) methodLines.push(methodCurrentLine);

    const methodLineHeight = methodFontSize * 1.2;
    const methodBlockHeight = methodLines.length * methodLineHeight;
    // Centre the method block in the same area (60px below rating baseline)
    const methodBlockTopY = ratingY + ratingFontSize + 60;

    const methodElements = methodLines.map((line, i) => `
    <text
      x="50%"
      y="${methodBlockTopY + (i * methodLineHeight) + methodFontSize}"
      text-anchor="middle"
      fill="#FFFFFF"
      font-family="'Bebas Neue', 'Arial Black', Impact, sans-serif"
      font-weight="bold"
      font-size="${methodFontSize}px"
    >${escXml(line)}</text>
  `).join('');

    // Layer 3 — Subtext (grey, 38px, 50px below method block bottom)
    const subtextFontSize = 38;
    const subtextMaxWidth = Math.floor(WIDTH * 0.75);
    const subtextCharWidth = subtextFontSize * CHAR_WIDTH_NORMAL;
    const subtextMaxChars = Math.floor(subtextMaxWidth / subtextCharWidth);
    const subtextWords = subtext.split(/\s+/);
    const subtextLines: string[] = [];
    let currentLine = '';
    subtextWords.forEach(word => {
        if (currentLine.length > 0 && (currentLine + ' ' + word).length > subtextMaxChars) {
            subtextLines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
        }
    });
    if (currentLine) subtextLines.push(currentLine);

    // Subtext starts 50px below the bottom of the method block
    const subtextStartY = methodBlockTopY + methodBlockHeight + 50;
    const subtextLineHeight = subtextFontSize * 1.4;

    const subtextElements = subtextLines.map((line, i) => `
    <text
      x="50%"
      y="${subtextStartY + (i * subtextLineHeight) + subtextFontSize}"
      text-anchor="middle"
      fill="#AAAAAA"
      font-family="Arial, 'Helvetica Neue', sans-serif"
      font-weight="bold"
      font-size="${subtextFontSize}px"
    >${escXml(line)}</text>
  `).join('');

    return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" />
      <text
        x="50%"
        y="${ratingY + ratingFontSize}"
        text-anchor="middle"
        fill="#FF6B35"
        font-family="'Bebas Neue', 'Arial Black', Impact, sans-serif"
        font-weight="bold"
        font-size="${ratingFontSize}px"
      >${escXml(ratingText)}</text>
      ${methodElements}
      ${subtextElements}
    </svg>
  `);
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
                const tipsOverlay = generateTipsCardSvg(
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

                const { error: uploadError } = await supabaseStorage.storage
                    .from('content-assets')
                    .upload(fileName, processed, { contentType: 'image/jpeg', upsert: true });

                if (uploadError) {
                    console.error(`[render-slides] ❌ Upload failed for slide ${slide.slide_number}:`, uploadError.message);
                    throw new Error(`Storage upload failed for slide ${slide.slide_number}: ${uploadError.message}`);
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
