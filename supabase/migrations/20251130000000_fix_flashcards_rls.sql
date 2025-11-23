-- Create decks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create flashcards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view public decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can insert own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can update own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON public.decks;
DROP POLICY IF EXISTS "Admins can do everything on decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view decks" ON public.decks;
DROP POLICY IF EXISTS "Users can insert decks" ON public.decks;
DROP POLICY IF EXISTS "Users can update decks" ON public.decks;
DROP POLICY IF EXISTS "Users can delete decks" ON public.decks;

-- Decks Policies

-- SELECT: Public decks OR Owner OR Admin
CREATE POLICY "Users can view decks"
  ON public.decks FOR SELECT
  USING (
    is_public = true 
    OR user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Authenticated users
CREATE POLICY "Users can insert decks"
  ON public.decks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Owner OR Admin
CREATE POLICY "Users can update decks"
  ON public.decks FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Owner OR Admin
CREATE POLICY "Users can delete decks"
  ON public.decks FOR DELETE
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Flashcards Policies
DROP POLICY IF EXISTS "Users can view flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can insert flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete flashcards" ON public.flashcards;

-- SELECT: If user can view the deck
CREATE POLICY "Users can view flashcards"
  ON public.flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
      AND (
        decks.is_public = true 
        OR decks.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- INSERT: If user can edit the deck (Owner OR Admin)
CREATE POLICY "Users can insert flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
      AND (
        decks.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- UPDATE: If user can edit the deck (Owner OR Admin)
CREATE POLICY "Users can update flashcards"
  ON public.flashcards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
      AND (
        decks.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- DELETE: If user can edit the deck (Owner OR Admin)
CREATE POLICY "Users can delete flashcards"
  ON public.flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = flashcards.deck_id
      AND (
        decks.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );
