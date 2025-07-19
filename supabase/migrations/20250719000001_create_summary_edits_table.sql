-- Create summary_edits table for versioning
CREATE TABLE summary_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    edit_type TEXT NOT NULL CHECK (edit_type IN ('resummarize', 'manual_edit')),
    previous_content TEXT,
    new_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_summary_edits_content_item_id ON summary_edits(content_item_id);
CREATE INDEX idx_summary_edits_created_at ON summary_edits(created_at);

-- Add RLS policies for the summary_edits table
ALTER TABLE summary_edits ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow all reads (since this is a single-user app)
CREATE POLICY "Enable read access for all users" ON summary_edits
    FOR SELECT
    USING (true);

-- Policy for INSERT: Allow all inserts (since this is a single-user app)
CREATE POLICY "Enable insert access for all users" ON summary_edits
    FOR INSERT
    WITH CHECK (true);

-- Policy for UPDATE: Allow all updates (since this is a single-user app)
CREATE POLICY "Enable update access for all users" ON summary_edits
    FOR UPDATE
    USING (true);

-- Policy for DELETE: Allow all deletes (since this is a single-user app)
CREATE POLICY "Enable delete access for all users" ON summary_edits
    FOR DELETE
    USING (true);