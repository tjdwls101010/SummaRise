import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // First, get the original content
    const { data: item, error: fetchError } = await supabase
      .from('content_items')
      .select('original_content, content_type, title')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch content item' },
        { status: 500 }
      );
    }

    if (!item.original_content) {
      return NextResponse.json(
        { error: 'No original content available for resummarization' },
        { status: 400 }
      );
    }

    // Call the summarization Edge Function
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
      'summarize-content',
      {
        body: {
          content: item.original_content,
          content_type: item.content_type,
          title: item.title || 'Untitled'
        }
      }
    );

    if (edgeFunctionError) {
      console.error('Edge function error:', edgeFunctionError);
      return NextResponse.json(
        { error: 'Failed to resummarize content' },
        { status: 500 }
      );
    }

    const newSummary = edgeFunctionData?.summary;
    if (!newSummary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Update the content item with new summary
    const { data: updatedItem, error: updateError } = await supabase
      .from('content_items')
      .update({
        summary: newSummary,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, summary, updated_at')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content item' },
        { status: 500 }
      );
    }

    // Record the edit in summary_edits table for versioning
    const { error: editRecordError } = await supabase
      .from('summary_edits')
      .insert({
        content_item_id: id,
        edit_type: 'resummarize',
        previous_content: item.original_content,
        new_content: newSummary,
        created_at: new Date().toISOString()
      });

    if (editRecordError) {
      console.error('Failed to record edit history:', editRecordError);
      // Don't fail the request if we can't record history
    }

    return NextResponse.json({
      success: true,
      summary: updatedItem.summary,
      updated_at: updatedItem.updated_at
    });

  } catch (error) {
    console.error('Resummarize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}