import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync } from 'fs';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { presentationId, slideId, slideCode } = await request.json();

    if (!slideCode) {
      return NextResponse.json(
        { error: 'Slide code is required' },
        { status: 400 }
      );
    }

    // Create temporary directory for output
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'remotion-'));
    const outputPath = path.join(tmpDir, 'output.mp4');

    // Bundle Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion/Root.tsx'),
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'Slide',
      inputProps: {
        slideCode,
      },
    });

    // Render video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        slideCode,
      },
    });

    // Upload to Supabase Storage (optional)
    if (presentationId && slideId) {
      const videoBuffer = require('fs').readFileSync(outputPath);
      const fileName = `${presentationId}/${slideId}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from('presentation-videos')
        .upload(fileName, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      // Get public URL
      const { data } = supabase.storage
        .from('presentation-videos')
        .getPublicUrl(fileName);

      return NextResponse.json({
        success: true,
        videoUrl: data.publicUrl,
      });
    }

    // Return file for download
    const videoBuffer = require('fs').readFileSync(outputPath);
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="slide-${slideId || Date.now()}.mp4"`,
      },
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: 'Failed to render video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
