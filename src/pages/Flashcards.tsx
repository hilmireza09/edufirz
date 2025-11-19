import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CreditCard, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, ChevronLeft, ChevronRight, Edit, Trash, Tag, RotateCcw, CheckCircle, XCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FlashcardEditor from '@/components/FlashcardEditor';
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
  [key: string]: unknown;
};

const Flashcards = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(true);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // New state for search and pagination
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const [flashcardsSearchQuery, setFlashcardsSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role || 'student');
        setProfile(data);
      } else {
        console.error('Error fetching profile:', error);
        setUserRole('student');
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  // Fetch decks based on user role
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user || loading) return;
      
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
      }
    };

    fetchDecks();
  }, [user, userRole, loading, selectedDeck, editingDeck]);

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
  };

  const handleCreateDeck = () => {
    if (!user) return;

    const newDeck: Deck = {
      id: '',
      title: 'New Deck',
      description: '',
      is_public: false,
      user_id: user.id,
      tags: [],
      flashcards: [],
    };

    setEditingDeck(newDeck);
    setSelectedDeck(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here - could search across decks, flashcards, etc.
    console.log('Searching for:', searchQuery);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [flashcardsSearchQuery, selectedTag]);

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
    setIndex((i) => (i + 1) % selectedDeck.flashcards.length);
  };

  const prev = () => {
    if (!selectedDeck) return;
    setFlipped(false);
    setIndex((i) => (i - 1 + selectedDeck.flashcards.length) % selectedDeck.flashcards.length);
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (editingDeck) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <FlashcardEditor 
            deck={editingDeck} 
            onSave={handleSaveDeck}
            onCancel={() => setEditingDeck(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Glassmorphism Sidebar */}
      <div className="w-64 min-h-screen p-6 bg-background/80 backdrop-blur-xl border-r border-border sticky top-0">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">EduLearn</span>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    navigate('/dashboard');
                  } else if (item.id === 'flashcards') {
                    navigate('/flashcards');
                  } else if (item.id === 'quizzes') {
                    navigate('/quizzes');
                  } else if (item.id === 'classes') {
                    navigate('/classes');
                  } else if (item.id === 'forum') {
                    navigate('/forum');
                  } else if (item.id === 'settings') {
                    navigate('/dashboard');
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  item.id === 'flashcards'
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-sm'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-border hover:bg-accent"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with General Search */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-border p-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search courses, resources, or topics..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg py-2 z-10 border border-border">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-medium text-foreground truncate">
                      {profile?.full_name || user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {userRole}
                    </p>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="px-4 py-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-border hover:bg-accent"
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

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background to-muted">
          <div className="space-y-6">
            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
              <p className="text-muted-foreground">Study and memorize key concepts</p>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search flashcards..."
                      value={flashcardsSearchQuery}
                      onChange={(e) => setFlashcardsSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-border"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="bg-background/50 border-border">
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
                {(userRole === 'teacher' || userRole === 'admin' || userRole === 'student') && (
                  <Button onClick={handleCreateDeck} className="flex items-center gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    New Deck
                  </Button>
                )}
              </div>
            </div>

            {/* Decks Grid */}
            {filteredDecks.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No Flashcard Decks Found</h2>
                <p className="text-muted-foreground mb-6">
                  {decks.length === 0 ? "Create your first deck to get started" : "Try adjusting your search or filter"}
                </p>
                {decks.length === 0 && (
                  <Button onClick={handleCreateDeck} className="flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" />
                    Create Deck
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:bg-card/70 transition-all cursor-pointer group"
                      onClick={() => handleDeckSelect(deck)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(userRole === 'admin' || deck.user_id === user?.id || (userRole === 'teacher' && deck.user_id === user?.id)) && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
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
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                          <h3 className="font-semibold text-foreground text-lg line-clamp-2">{deck.title}</h3>
                          {deck.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{deck.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{deck.flashcards.length} cards</span>
                          <div className="flex gap-1">
                            {deck.is_public && (
                              <Badge variant="secondary" className="text-xs">Public</Badge>
                            )}
                            {deck.user_id !== user?.id && (
                              <Badge variant="outline" className="text-xs">Shared</Badge>
                            )}
                          </div>
                        </div>

                        {deck.tags && deck.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {deck.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {deck.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{deck.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {deck.user_id === user?.id ? 'Your deck' : 'Shared deck'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="w-10 h-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Focused Learning View */}
            {selectedDeck && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{selectedDeck.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Card {index + 1} of {selectedDeck.flashcards.length}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedDeck(null)} 
                        className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                        aria-label="Close learning view"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    {selectedDeck.flashcards.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">This deck has no flashcards yet</p>
                        {(userRole === 'admin' || selectedDeck.user_id === user?.id || (userRole === 'teacher' && selectedDeck.user_id === user?.id)) && (
                          <Button
                            onClick={() => handleEditDeck(selectedDeck)}
                            className="mt-4 flex items-center gap-2 mx-auto"
                          >
                            <Plus className="h-4 w-4" />
                            Add Cards
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Flashcard Container */}
                        <div className="flex justify-center my-8">
                          <div
                            className="relative w-full max-w-lg h-80 cursor-pointer [perspective:1000px] select-none"
                            onClick={() => setFlipped(!flipped)}
                          >
                            <div
                              className={`absolute inset-0 rounded-2xl shadow-lg p-8 flex items-center justify-center text-center transition-all duration-500 [transform-style:preserve-3d] ${
                                flipped ? '[transform:rotateY(180deg)]' : ''
                              }`}
                            >
                              {/* Front of card */}
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-border flex items-center justify-center [backface-visibility:hidden] p-6">
                                <div>
                                  <span className="text-xs text-primary font-semibold mb-4 block uppercase tracking-wide">Question</span>
                                  <p className="text-xl text-foreground leading-relaxed">{selectedDeck.flashcards[index]?.front || ''}</p>
                                </div>
                              </div>

                              {/* Back of card */}
                              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-2xl border border-border flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] p-6">
                                <div>
                                  <span className="text-xs text-secondary font-semibold mb-4 block uppercase tracking-wide">Answer</span>
                                  <p className="text-xl text-foreground leading-relaxed">{selectedDeck.flashcards[index]?.back || ''}</p>
                                  {selectedDeck.flashcards[index]?.hint && (
                                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                      <p className="text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">Hint:</span> {selectedDeck.flashcards[index]?.hint}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={prev}
                            disabled={selectedDeck.flashcards.length <= 1}
                            className="w-full sm:w-auto flex items-center gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <Button
                            onClick={() => setFlipped(!flipped)}
                            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          >
                            {flipped ? 'Show Question' : 'Show Answer'}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={next}
                            disabled={selectedDeck.flashcards.length <= 1}
                            className="w-full sm:w-auto flex items-center gap-2"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Progress indicators */}
                        <div className="flex justify-center mt-6">
                          <div className="flex gap-2">
                            {selectedDeck.flashcards.map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  i === index
                                    ? 'bg-primary w-6'
                                    : i < index
                                      ? 'bg-primary/50'
                                      : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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