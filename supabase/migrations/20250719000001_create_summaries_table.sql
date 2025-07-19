-- Create summaries table for storing content summaries
-- Based on PRD requirements for SummaRise project

CREATE TABLE summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    source_url text NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('youtube', 'article')),
    title text NOT NULL,
    channel_or_site text,
    original_content text NOT NULL,
    summarized_content text NOT NULL,
    tags text[] DEFAULT '{}',
    status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_summaries_content_type ON summaries(content_type);
CREATE INDEX idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX idx_summaries_status ON summaries(status);

-- Create GIN index for tags array
CREATE INDEX idx_summaries_tags ON summaries USING gin(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON summaries
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE summaries IS 'Stores content summaries from YouTube videos and web articles';
COMMENT ON COLUMN summaries.source_url IS 'Original URL of the content (YouTube video or web article)';
COMMENT ON COLUMN summaries.content_type IS 'Type of content: youtube or article';
COMMENT ON COLUMN summaries.title IS 'Title of the content';
COMMENT ON COLUMN summaries.channel_or_site IS 'YouTube channel name or website hostname';
COMMENT ON COLUMN summaries.original_content IS 'Original extracted content (transcript or article text)';
COMMENT ON COLUMN summaries.summarized_content IS 'LLM-generated summary of the content';
COMMENT ON COLUMN summaries.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN summaries.status IS 'Processing status of the summary';