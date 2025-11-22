import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, LogOut, BookOpen, CreditCard, GraduationCap, Users, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type SearchResult = {
  id: string;
  title: string;
  type: 'deck' | 'flashcard' | 'quiz' | 'class' | 'forum';
  url: string;
  description?: string;
};

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search with debouncing
  // Implements case-insensitive partial matching using Supabase ilike with % wildcards
  // Example: searching "class" will match "Science Class", "class A", "my class notes", etc.
  // Searches across: Decks, Flashcards, Quizzes, Classes, and Forum Posts
  // Returns maximum 5 results total, updates every 300ms after user stops typing
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        // Use lowercase for case-insensitive search with wildcard patterns
        const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
        const results: SearchResult[] = [];

        // Query all content types in parallel with LIMIT 5 each
        // Using ilike for case-insensitive partial matching with % wildcards
        const [decksData, flashcardsData, quizzesData, classesData, forumData] = await Promise.all([
          // Search Decks - partial match in title or description
          supabase
            .from('decks')
            .select('id, title, description')
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .is('deleted_at', null)
            .limit(5),
          
          // Search Flashcards - partial match in front or back
          supabase
            .from('flashcards')
            .select('id, front, back, deck_id')
            .or(`front.ilike.${searchTerm},back.ilike.${searchTerm}`)
            .is('deleted_at', null)
            .limit(5),
          
          // Search Quizzes - partial match in title or description
          supabase
            .from('quizzes')
            .select('id, title, description')
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .is('deleted_at', null)
            .limit(5),
          
          // Search Classes - partial match in name or description
          supabase
            .from('classes')
            .select('id, name, description')
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
          
          // Search Forum Posts - partial match in title or content
          supabase
            .from('forum_posts')
            .select('id, title, content')
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5)
        ]);

        // Process Decks
        if (decksData.data) {
          decksData.data.forEach(deck => {
            results.push({
              id: deck.id,
              title: deck.title,
              type: 'deck',
              url: `/flashcards`,
              description: deck.description || undefined
            });
          });
        }

        // Process Flashcards
        if (flashcardsData.data) {
          flashcardsData.data.forEach(card => {
            results.push({
              id: card.id,
              title: card.front,
              type: 'flashcard',
              url: `/flashcards`,
              description: card.back ? (card.back.length > 60 ? card.back.substring(0, 60) + '...' : card.back) : undefined
            });
          });
        }

        // Process Quizzes
        if (quizzesData.data) {
          quizzesData.data.forEach(quiz => {
            results.push({
              id: quiz.id,
              title: quiz.title,
              type: 'quiz',
              url: `/quizzes/${quiz.id}/take`,
              description: quiz.description || undefined
            });
          });
        }

        // Process Classes
        if (classesData.data) {
          classesData.data.forEach(cls => {
            results.push({
              id: cls.id,
              title: cls.name,
              type: 'class',
              url: `/classes/${cls.id}`,
              description: cls.description || undefined
            });
          });
        }

        // Process Forum Posts
        if (forumData.data) {
          forumData.data.forEach(post => {
            const contentPreview = post.content && post.content.length > 60 
              ? post.content.substring(0, 60) + '...' 
              : post.content;
            results.push({
              id: post.id,
              title: post.title,
              type: 'forum',
              url: `/forum/post/${post.id}`,
              description: contentPreview || undefined
            });
          });
        }

        // Limit total results to 5
        setSearchResults(results.slice(0, 5));
        setSelectedIndex(-1); // Reset selection when results change
      } catch (error) {
        setSearchResults([]);
        setSelectedIndex(-1);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search - wait 300ms after user stops typing
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // If user presses Enter with a selected result, navigate to it
    if (selectedIndex >= 0 && searchResults[selectedIndex]) {
      handleResultClick(searchResults[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'deck':
      case 'flashcard':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'quiz':
        return <GraduationCap className="h-4 w-4 text-purple-500" />;
      case 'class':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'forum':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'deck':
        return 'Deck';
      case 'flashcard':
        return 'Flashcard';
      case 'quiz':
        return 'Quiz';
      case 'class':
        return 'Class';
      case 'forum':
        return 'Forum Post';
      default:
        return '';
    }
  };

  const userRole = profile?.role || 'student';

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 p-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
           <BookOpen className="h-8 w-8 text-primary" />
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
          <div className="relative group" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors z-10" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-spin z-10" />
            )}
            <input
              type="text"
              placeholder="Search across platform..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-white/20 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
            />
            
            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                {isSearching && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 transition-colors text-left flex items-start gap-3 group ${
                          index === selectedIndex ? 'bg-primary/10' : 'hover:bg-primary/5'
                        }`}
                      >
                        <div className="mt-0.5">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {result.title}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim().length >= 2 && !isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="h-5 w-5 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try different keywords</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </form>

        {/* User Profile */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{profile?.full_name || 'Student'}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all ring-2 ring-white/50">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-white/20 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-foreground truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
