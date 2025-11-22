-- Drop existing constraint on forum_post_votes if it exists
ALTER TABLE public.forum_post_votes DROP CONSTRAINT IF EXISTS forum_post_votes_vote_type_check;

-- Update any existing invalid vote types to 'helpful'
UPDATE public.forum_post_votes SET vote_type = 'helpful' WHERE vote_type NOT IN ('up', 'helpful');

-- Add new constraint to allow 'up' and 'helpful'
ALTER TABLE public.forum_post_votes ADD CONSTRAINT forum_post_votes_vote_type_check CHECK (vote_type IN ('up', 'helpful'));

-- Create forum_reply_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.forum_reply_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'helpful')) DEFAULT 'up',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- Enable RLS for forum_reply_votes
ALTER TABLE public.forum_reply_votes ENABLE ROW LEVEL SECURITY;

-- Policies for forum_reply_votes
DROP POLICY IF EXISTS "Forum reply votes are viewable by everyone" ON public.forum_reply_votes;
CREATE POLICY "Forum reply votes are viewable by everyone"
    ON public.forum_reply_votes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote on replies" ON public.forum_reply_votes;
CREATE POLICY "Authenticated users can vote on replies"
    ON public.forum_reply_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change their reply vote" ON public.forum_reply_votes;
CREATE POLICY "Users can change their reply vote"
    ON public.forum_reply_votes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reply vote" ON public.forum_reply_votes;
CREATE POLICY "Users can remove their reply vote"
    ON public.forum_reply_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Add to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'forum_reply_votes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_reply_votes;
    END IF;
END $$;

-- Create view for posts with counts
CREATE OR REPLACE VIEW public.forum_posts_with_counts WITH (security_invoker = on) AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.category,
    p.is_pinned,
    p.is_solved,
    p.created_at,
    p.updated_at,
    (SELECT COUNT(*) FROM public.forum_post_votes v WHERE v.post_id = p.id AND v.vote_type = 'up') as upvotes,
    (SELECT COUNT(*) FROM public.forum_post_votes v WHERE v.post_id = p.id AND v.vote_type = 'helpful') as helpfuls,
    (SELECT COUNT(*) FROM public.forum_replies r WHERE r.post_id = p.id) as reply_count
FROM public.forum_posts p;
