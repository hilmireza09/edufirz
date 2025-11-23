import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, ChevronLeft, ChevronRight, Edit, Trash, Tag, RotateCcw, CheckCircle, XCircle, X, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FlashcardEditor from '@/components/FlashcardEditor';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type Card = {
  id: string;
  front: string;
  back: string;
  hint: string | null;
};

type Deck = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  tags: string[] | null;
  flashcards: Card[];
};

type Profile = {
  id: string;
  role: string;
  full_name?: string;
  [key: string]: unknown;
};

const Flashcards = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // New state for search and pagination
  const [flashcardsSearchQuery, setFlashcardsSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [searchQuery, setSearchQuery] = useState('');
  const decksPerPage = 9;

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; title: string } | null>(null);

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: BookOpen },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  // Use profile from useAuth instead of fetching
  useEffect(() => {
    if (profile) {
      setUserRole(profile.role || 'student');
      setProfile(profile);
    }
  }, [profile]);

  // Fetch decks based on user role
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user || !userRole) return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('decks')
          .select(`
            id, 
            title, 
            description, 
            is_public, 
            user_id,
            tags,
            flashcards (
              id, 
              front, 
              back, 
              hint
            )
          `)
          .is('deleted_at', null);

        // Role-based deck access
        if (userRole === 'student') {
          // Students see their own decks + public decks
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        } else if (userRole === 'teacher') {
          // Teachers see their own decks + public decks
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        }
        // Admins see all decks (handled by RLS)

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
        const decksData = data.map(deck => ({
          ...deck,
          flashcards: Array.isArray(deck.flashcards) ? deck.flashcards : []
        }));

        setDecks(decksData);
        // Removed auto-selection of first deck - let user choose manually
      } catch (error) {
        console.error('Error fetching decks:', error);
        toast.error('Failed to load flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user, userRole]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtering and pagination logic
  const { filteredDecks, allTags, totalPages, currentDecks } = useMemo(() => {
    // Filter decks based on search query and selected tag
    const filtered = decks.filter(deck => {
      const matchesSearch = flashcardsSearchQuery === '' ||
        deck.title.toLowerCase().includes(flashcardsSearchQuery.toLowerCase()) ||
        deck.description?.toLowerCase().includes(flashcardsSearchQuery.toLowerCase()) ||
        deck.flashcards.some(card =>
          card.front.toLowerCase().includes(flashcardsSearchQuery.toLowerCase()) ||
          card.back.toLowerCase().includes(flashcardsSearchQuery.toLowerCase())
        );

      const matchesTag = selectedTag === '' || selectedTag === 'all' ||
        (deck.tags && deck.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });

    // Extract all unique tags
    const tagSet = new Set<string>();
    filtered.forEach(deck => {
      if (deck.tags) {
        deck.tags.forEach(tag => tagSet.add(tag));
      }
    });
    const allTags = Array.from(tagSet).sort();

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / decksPerPage);
    const startIndex = (currentPage - 1) * decksPerPage;
    const currentDecks = filtered.slice(startIndex, startIndex + decksPerPage);

    return { filteredDecks: filtered, allTags, totalPages, currentDecks };
  }, [decks, flashcardsSearchQuery, selectedTag, currentPage, decksPerPage]);

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeck(deck);
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
  };

  const handleCreateDeck = () => {
    navigate('/flashcards/new');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here - could search across decks, flashcards, etc.
    console.log('Searching for:', searchQuery);
  };

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  // Reset to first page when filters change
  const prevSearchQuery = useRef(flashcardsSearchQuery);
  const prevSelectedTag = useRef(selectedTag);
  
  useEffect(() => {
    if (prevSearchQuery.current !== flashcardsSearchQuery || prevSelectedTag.current !== selectedTag) {
      if (currentPage > 1) {
        setSearchParams({ page: '1' });
      }
      prevSearchQuery.current = flashcardsSearchQuery;
      prevSelectedTag.current = selectedTag;
    }
  }, [flashcardsSearchQuery, selectedTag, currentPage, setSearchParams]);

  const handleEditDeck = (deck: Deck) => {
    navigate(`/flashcards/decks/${deck.id}/edit`);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (!user) return;
    
    // Check permissions
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    const canDelete = 
      userRole === 'admin' || 
      deck.user_id === user.id || 
      (userRole === 'teacher' && deck.user_id === user.id);
    
    if (!canDelete) {
      toast.error('You do not have permission to delete this deck');
      return;
    }
    
    setDeckToDelete({ id: deckId, title: deck.title });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    
    try {
      const { error } = await supabase
        .from('decks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deckToDelete.id);

      if (error) throw error;
      
      setDecks(decks.filter(d => d.id !== deckToDelete.id));
      if (selectedDeck?.id === deckToDelete.id) {
        setSelectedDeck(decks.length > 1 ? decks[0] : null);
      }
      toast.success('Deck deleted successfully');
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast.error('Failed to delete deck');
    } finally {
      setDeckToDelete(null);
    }
  };

  const next = () => {
    if (!selectedDeck) return;
    setFlipped(false);
    setShowHint(false);
    setIndex((i) => (i + 1) % selectedDeck.flashcards.length);
  };

  const prev = () => {
    if (!selectedDeck) return;
    setFlipped(false);
    setShowHint(false);
    setIndex((i) => (i - 1 + selectedDeck.flashcards.length) % selectedDeck.flashcards.length);
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-background to-muted">
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            {/* Header - Always Visible */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">Flashcards</h1>
              </div>
              {(userRole === 'teacher' || userRole === 'admin' || userRole === 'student') && (
                <Button onClick={handleCreateDeck} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Deck
                </Button>
              )}
            </div>

            {/* Filters - Always Visible */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search decks..."
                    value={flashcardsSearchQuery}
                    onChange={(e) => setFlashcardsSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-full px-3 py-2 rounded-md bg-background border border-border">
                      <SelectValue placeholder="Filter by tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Decks Grid - Content Only Loading */}
            {loading ? (
              /* Loading Skeleton for Deck Grid Only */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold">No Decks Found</h2>
                <p className="text-muted-foreground">Create your first deck to get started</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/50 shadow-sm p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                      onClick={() => handleDeckSelect(deck)}
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{deck.title}</h3>
                        <div className="flex gap-1 shrink-0 -mr-2 -mt-2">
                          {(userRole === 'admin' || deck.user_id === user?.id || (userRole === 'teacher' && deck.user_id === user?.id)) && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDeck(deck);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDeck(deck.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">{deck.description || 'No description available'}</p>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium mt-auto pt-3 border-t border-white/10 dark:border-slate-800/50">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          <CreditCard className="h-3 w-3" /> {deck.flashcards.length} Cards
                        </span>
                        
                        {deck.is_public && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">Public</span>
                        )}
                        
                        {deck.user_id !== user?.id && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">Shared</span>
                        )}

                        {deck.tags && deck.tags.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-muted-foreground ml-auto">
                            <Tag className="h-3 w-3" /> {deck.tags[0]}
                            {deck.tags.length > 1 && ` +${deck.tags.length - 1}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center mt-8 gap-2">
                    <Button 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          className={`w-10 h-10 rounded-xl p-0 ${currentPage === page ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25' : 'glass-card hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm border-white/20'}`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Focused Learning View (Modal) */}
      {selectedDeck && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedDeck.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-primary">Card {index + 1}</span>
                  <span className="text-sm text-muted-foreground">of {selectedDeck.flashcards.length}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedDeck(null)} 
                className="h-10 w-10 p-0 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50">
              {selectedDeck.flashcards.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-600 font-medium">This deck is empty</p>
                  <p className="text-muted-foreground mb-6">Add some cards to start studying!</p>
                  {(userRole === 'admin' || selectedDeck.user_id === user?.id || (userRole === 'teacher' && selectedDeck.user_id === user?.id)) && (
                    <Button onClick={() => handleEditDeck(selectedDeck)} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cards
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Flashcard 3D Flip Container */}
                  <div className="w-full max-w-2xl aspect-[3/2] perspective-1000 mb-8 group">
                    <div
                      className={`relative w-full h-full transition-all duration-700 transform-style-3d cursor-pointer ${
                        flipped ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => setFlipped(!flipped)}
                    >
                      {/* Front Face */}
                      <div className="absolute inset-0 backface-hidden">
                        <div className="h-full w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center hover:shadow-2xl hover:shadow-primary/5 transition-shadow">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <span className="text-primary font-bold text-lg">Q</span>
                          </div>
                          <p className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                            {selectedDeck.flashcards[index]?.front}
                          </p>
                          
                          {/* Hint Display */}
                          {showHint && selectedDeck.flashcards[index]?.hint && (
                            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
                                <Lightbulb className="h-4 w-4 fill-purple-700" />
                                <span className="text-sm font-medium">{selectedDeck.flashcards[index]?.hint}</span>
                              </div>
                            </div>
                          )}

                          <p className="mt-auto text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Click to flip</p>
                        </div>
                      </div>

                      {/* Back Face */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180">
                        <div className="h-full w-full bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-slate-800 dark:to-slate-800 rounded-3xl shadow-xl border-2 border-primary/10 p-8 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          <p className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                            {selectedDeck.flashcards[index]?.back}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4 mb-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={prev}
                      disabled={selectedDeck.flashcards.length <= 1}
                      className="rounded-xl h-12 px-6 border-gray-200 hover:bg-white hover:shadow-md transition-all"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Prev
                    </Button>

                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedDeck.flashcards[index]?.hint) {
                          setShowHint(true);
                        }
                      }}
                      disabled={showHint || !selectedDeck.flashcards[index]?.hint}
                      className={`rounded-xl h-12 px-8 transition-all duration-300 ${
                        showHint || !selectedDeck.flashcards[index]?.hint
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none' 
                          : 'bg-white text-purple-600 border border-purple-100 hover:bg-purple-50 hover:border-purple-200 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20'
                      }`}
                    >
                      <Lightbulb className={`h-4 w-4 mr-2 ${showHint ? 'fill-gray-400' : 'fill-purple-600'}`} />
                      {showHint ? 'Hint Shown' : 'Show Hint'}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={next}
                      disabled={selectedDeck.flashcards.length <= 1}
                      className="rounded-xl h-12 px-6 border-gray-200 hover:bg-white hover:shadow-md transition-all"
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{Math.round(((index + 1) / selectedDeck.flashcards.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${((index + 1) / selectedDeck.flashcards.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeckToDelete(null);
        }}
        onConfirm={confirmDeleteDeck}
        title="Delete Flashcard Deck"
        message="Are you sure you want to delete this flashcard deck? All cards in this deck will be permanently removed."
        itemName={deckToDelete?.title}
        confirmText="Delete Deck"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Flashcards;