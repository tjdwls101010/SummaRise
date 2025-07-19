import { NextRequest, NextResponse } from 'next/server';
import { createPureClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { newContent } = await request.json();

    if (!newContent || typeof newContent !== 'string') {
      return NextResponse.json(
        { error: 'New content is required and must be a string' },
        { status: 400 }
      );
    }

    const supabase = await createPureClient();

    // First, get the current content for versioning
    const { data: currentItem, error: fetchError } = await supabase
      .from('content_items')
      .select('summary')
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
        { error: 'Failed to fetch current content' },
        { status: 500 }
      );
    }

    // Update the content item with new summary
    const { data: updatedItem, error: updateError } = await supabase
      .from('content_items')
      .update({
        summary: newContent.trim(),
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
        edit_type: 'manual_edit',
        previous_content: currentItem.summary,
        new_content: newContent.trim(),
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
    console.error('Edit content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}