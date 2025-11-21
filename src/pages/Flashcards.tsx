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
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
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
    setEditingDeck(deck);
    setSelectedDeck(null);
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

  const handleSaveDeck = (updatedDeck: Deck) => {
    // Update the decks list with the saved deck
    const updatedDecks = decks.map(deck => 
      deck.id === updatedDeck.id ? updatedDeck : deck
    );
    
    // If it's a new deck, add it to the list
    if (!decks.some(deck => deck.id === updatedDeck.id)) {
      updatedDecks.unshift(updatedDeck);
    }
    
    setDecks(updatedDecks);
    setSelectedDeck(updatedDeck);
    setEditingDeck(null);
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

  if (editingDeck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <FlashcardEditor 
            deck={editingDeck} 
            onSave={handleSaveDeck}
            onCancel={() => setEditingDeck(null)}
            userRole={userRole}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[120px]" />
        </div>

        {/* Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header - Always Visible */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">Flashcards</h1>
                <p className="text-muted-foreground text-lg">Master your subjects with interactive study decks.</p>
              </div>
              {(userRole === 'teacher' || userRole === 'admin' || userRole === 'student') && (
                <Button 
                  onClick={handleCreateDeck} 
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl px-5 py-3 h-auto text-base font-medium transition-all hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Deck
                </Button>
              )}
            </div>

            {/* Search and Filter Controls - Always Visible */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-xl shadow-gray-200/20">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search your decks..."
                      value={flashcardsSearchQuery}
                      onChange={(e) => setFlashcardsSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-white/50 border-white/20 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl text-base transition-all"
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="h-12 bg-white/50 border-white/20 focus:ring-2 focus:ring-primary/20 rounded-xl">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <SelectValue placeholder="Filter by tag" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-xl border-white/20 rounded-xl shadow-xl">
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
                  <div key={i} className="bg-white/60 backdrop-blur-lg border border-white/40 rounded-2xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse" />
                        <div className="flex gap-1">
                          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="pt-4 border-t border-gray-100/50 flex items-center justify-between">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="flex gap-1.5 pt-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 border-dashed">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-10 w-10 text-primary/40" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Decks Found</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  We couldn't find any flashcard decks matching your search. Try adjusting your filters or create a new one.
                </p>
                <Button onClick={handleCreateDeck} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
                  Create Your First Deck
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="group relative bg-white/60 backdrop-blur-lg border border-white/40 rounded-2xl p-6 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                      onClick={() => handleDeckSelect(deck)}
                    >
                      {/* Hover Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-white/50 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <CreditCard className="h-7 w-7 text-primary" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            {(userRole === 'admin' || deck.user_id === user?.id || (userRole === 'teacher' && deck.user_id === user?.id)) && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-full hover:bg-white/80 hover:text-primary"
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
                                  className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500"
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

                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-gray-800 text-xl line-clamp-1 group-hover:text-primary transition-colors">{deck.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10 leading-relaxed">
                              {deck.description || 'No description provided.'}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-gray-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              {deck.flashcards.length} Cards
                            </div>
                            <div className="flex gap-2">
                              {deck.is_public && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">Public</span>
                              )}
                              {deck.user_id !== user?.id && (
                                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium border border-purple-100">Shared</span>
                              )}
                            </div>
                          </div>

                          {deck.tags && deck.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {deck.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-100/80 text-gray-500 text-xs border border-gray-200">
                                  #{tag}
                                </span>
                              ))}
                              {deck.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-400 text-xs border border-gray-100">
                                  +{deck.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-2 flex items-center gap-2 shadow-lg">
                      <Button
                        variant="ghost"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl hover:bg-white/80"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>

                      <div className="flex gap-1 px-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 rounded-xl p-0 ${page === currentPage ? 'bg-primary text-white shadow-md' : 'hover:bg-white/80'}`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-xl hover:bg-white/80"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
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