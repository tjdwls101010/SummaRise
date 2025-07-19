import { NextRequest, NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createPureClient();

    let supabaseQuery = supabase
      .from('content_items')
      .select(`
        id,
        title,
        summary,
        original_url,
        content_type,
        created_at,
        updated_at,
        metadata
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If search query is provided, use full-text search
    if (query && query.trim()) {
      const searchQuery = query.trim();
      
      // Use Supabase full-text search
      supabaseQuery = supabaseQuery.or(`
        title.ilike.%${searchQuery}%,
        summary.ilike.%${searchQuery}%
      `);
    }

    const { data: items, error, count } = await supabaseQuery;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content items' },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const transformedItems = items?.map(item => ({
      id: item.id.toString(),
      title: item.title || 'Untitled',
      summary: item.summary || 'No summary available',
      original_url: item.original_url,
      content_type: item.content_type,
      channel_or_site: item.metadata?.channel_or_site || 'Unknown',
      created_at: item.created_at,
      tags: item.metadata?.tags || [],
      thumbnail: item.content_type === 'youtube' 
        ? `https://img.youtube.com/vi/${extractYouTubeVideoId(item.original_url)}/mqdefault.jpg`
        : `https://picsum.photos/400/200?random=${item.id}`
    })) || [];

    return NextResponse.json({
      data: transformedItems,
      count: transformedItems.length,
      hasMore: transformedItems.length === limit,
      query: query || ''
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}