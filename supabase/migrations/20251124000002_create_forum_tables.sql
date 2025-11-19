-- Create forum_posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create forum_replies table
CREATE TABLE IF NOT EXISTS public.forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create forum_post_votes table
CREATE TABLE IF NOT EXISTS public.forum_post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) DEFAULT 'up',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;

-- Policies for forum_posts
CREATE POLICY "Forum posts are viewable by everyone"
    ON public.forum_posts FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON public.forum_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
    ON public.forum_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
    ON public.forum_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Policies for forum_replies
CREATE POLICY "Forum replies are viewable by everyone"
    ON public.forum_replies FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create replies"
    ON public.forum_replies FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies"
    ON public.forum_replies FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own replies"
    ON public.forum_replies FOR DELETE
    USING (auth.uid() = author_id);

-- Policies for forum_post_votes
CREATE POLICY "Forum votes are viewable by everyone"
    ON public.forum_post_votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON public.forum_post_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote"
    ON public.forum_post_votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
    ON public.forum_post_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Add realtime (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'forum_posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'forum_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'forum_post_votes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_post_votes;
    END IF;
END $$;
