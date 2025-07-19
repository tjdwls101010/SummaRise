import { createPureClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Bearer token authentication
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Bearer token' },
        { status: 401 }
      );
    }

    const token = authorization.replace('Bearer ', '');
    const expectedToken = process.env.API_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Bearer token' },
        { status: 401 }
      );
    }

    // Parse and validate JSON body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate URL input
    const { url } = body;
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request: Missing or invalid url field' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid URL format' },
        { status: 400 }
      );
    }

    // Determine content type based on URL
    const hostname = parsedUrl.hostname.toLowerCase();
    let contentType: 'youtube' | 'article';
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      contentType = 'youtube';
    } else {
      contentType = 'article';
    }

    // Insert pending record into Supabase content_items table
    const supabase = await createPureClient();
    
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        user_id: 1, // Default user ID for single-user system
        original_url: url,
        content_type: contentType,
        title: null, // Will be filled during processing
        summary: null, // Will be filled during processing
        tags: [],
        metadata: { status: 'pending' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insertion error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error: Failed to create summary job' },
        { status: 500 }
      );
    }

    // Return 202 Accepted with job ID and status
    return NextResponse.json(
      {
        id: data.id,
        status: 'pending',
        message: 'Summary job accepted and queued for processing'
      },
      { status: 202 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/summaries:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle non-POST methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Only POST requests are supported' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Only POST requests are supported' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Only POST requests are supported' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method Not Allowed: Only POST requests are supported' },
    { status: 405 }
  );
}