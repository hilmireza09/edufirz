import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CreditCard, GraduationCap, Users, LogOut, MessageSquare, Settings, Home, Calendar, FileText, Search, ChevronDown, User, Plus, ChevronLeft, ChevronRight, RotateCcw, Edit, Trash, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Flashcard states
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deckSearchQuery, setDeckSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 9;

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

  // Fetch user profile and role
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setUserRole(data.role || 'student');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch decks when flashcards section is active
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user || activeSection !== 'flashcards') return;
      
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
        
        // Extract all unique tags
        const tags = new Set<string>();
        decksData.forEach(deck => {
          if (deck.tags && Array.isArray(deck.tags)) {
            deck.tags.forEach(tag => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags));
        
        if (decksData.length > 0 && !selectedDeck) {
          setSelectedDeck(decksData[0]);
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
        toast.error('Failed to load flashcards');
      }
    };

    fetchDecks();
  }, [user, userRole, activeSection, selectedDeck]);

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'flashcards', title: 'Flashcards', icon: CreditCard },
    { id: 'quizzes', title: 'Quizzes', icon: GraduationCap },
    { id: 'classes', title: 'Classes', icon: Users },
    { id: 'forum', title: 'Forum', icon: MessageSquare },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const quickAccessItems = [
    { title: 'Assignments', icon: FileText, path: '/assignments' },
    { title: 'Schedule', icon: Calendar, path: '/schedule' },
    { title: 'Resources', icon: BookOpen, path: '/resources' },
    { title: 'Grades', icon: GraduationCap, path: '/grades' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeck(deck);
    setIndex(0);
    setFlipped(false);
    setCurrentPage(1); // Reset to first page when selecting a new deck
  };

  const handleCreateDeck = () => {
    if (!user) return;
    
    const newDeck: any = {
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

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setSelectedDeck(null);
  };

  const handleDeleteDeck = async (deckId: string) => {
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
    
    try {
      const { error } = await supabase
        .from('decks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deckId);

      if (error) throw error;
      
      setDecks(decks.filter(d => d.id !== deckId));
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(decks.length > 1 ? decks[0] : null);
      }
      toast.success('Deck deleted successfully');
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast.error('Failed to delete deck');
    }
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

  // Filter decks based on search and tag
  const filteredDecks = decks.filter(deck => {
    const matchesSearch = deck.title.toLowerCase().includes(deckSearchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(deckSearchQuery.toLowerCase());
    
    const matchesTag = tagFilter === '' || 
      (deck.tags && Array.isArray(deck.tags) && deck.tags.includes(tagFilter));
    
    return matchesSearch && matchesTag;
  });

  // Pagination logic for flashcards
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = selectedDeck ? selectedDeck.flashcards.slice(indexOfFirstCard, indexOfLastCard) : [];
  const totalPages = selectedDeck ? Math.ceil(selectedDeck.flashcards.length / cardsPerPage) : 0;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-6">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Explore your learning journey with our intuitive tools and resources.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {quickAccessItems.map((item, index) => (
                <div 
                  key={item.title}
                  className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl hover-lift animate-fade-in-up border border-border shadow-sm cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(item.path)}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">Access your {item.title.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'flashcards':
        if (editingDeck) {
          return (
            <div className="py-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingDeck.id ? 'Edit Deck' : 'Create New Deck'}
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingDeck(null)}
                  className="flex items-center gap-2"
                >
                  Back to Decks
                </Button>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Deck Title</label>
                    <Input
                      value={editingDeck.title}
                      onChange={(e) => setEditingDeck({...editingDeck, title: e.target.value})}
                      placeholder="Enter deck title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                    <textarea
                      value={editingDeck.description || ''}
                      onChange={(e) => setEditingDeck({...editingDeck, description: e.target.value})}
                      placeholder="Enter deck description"
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public"
                      checked={editingDeck.is_public}
                      onChange={(e) => setEditingDeck({...editingDeck, is_public: e.target.checked})}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="public" className="text-sm font-medium text-foreground">
                      Make this deck public
                    </label>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tags (comma separated)</label>
                    <Input
                      value={editingDeck.tags?.join(', ') || ''}
                      onChange={(e) => setEditingDeck({...editingDeck, tags: e.target.value.split(',').map(tag => tag.trim())})}
                      placeholder="e.g., math, science, history"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingDeck(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        let savedDeck;
                        if (editingDeck.id) {
                          // Update existing deck
                          const { data, error } = await supabase
                            .from('decks')
                            .update({
                              title: editingDeck.title,
                              description: editingDeck.description,
                              is_public: editingDeck.is_public,
                              tags: editingDeck.tags
                            })
                            .eq('id', editingDeck.id)
                            .select()
                            .single();
                          
                          if (error) throw error;
                          savedDeck = data;
                        } else {
                          // Create new deck
                          const { data, error } = await supabase
                            .from('decks')
                            .insert([{
                              title: editingDeck.title,
                              description: editingDeck.description,
                              is_public: editingDeck.is_public,
                              tags: editingDeck.tags,
                              user_id: editingDeck.user_id
                            }])
                            .select()
                            .single();
                          
                          if (error) throw error;
                          savedDeck = data;
                        }
                        
                        // Refresh decks
                        const { data: updatedDecks } = await supabase
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
                        
                        if (updatedDecks) {
                          const decksData = updatedDecks.map(deck => ({
                            ...deck,
                            flashcards: Array.isArray(deck.flashcards) ? deck.flashcards : []
                          }));
                          setDecks(decksData);
                          setSelectedDeck(savedDeck);
                        }
                        
                        setEditingDeck(null);
                        toast.success('Deck saved successfully');
                      } catch (error) {
                        console.error('Error saving deck:', error);
                        toast.error('Failed to save deck');
                      }
                    }}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    Save Deck
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
                <p className="text-muted-foreground">Study and memorize key concepts</p>
              </div>
              <Button onClick={handleCreateDeck} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Deck
              </Button>
            </div>
            
            {decks.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No Flashcard Decks</h2>
                <p className="text-muted-foreground mb-6">Create your first deck to get started</p>
                <Button onClick={handleCreateDeck} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Create Deck
                </Button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Deck List with Search and Filter */}
                <div className="lg:w-1/3">
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-sm mb-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search decks..."
                        className="pl-10"
                        value={deckSearchQuery}
                        onChange={(e) => setDeckSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <select
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                      >
                        <option value="">All Tags</option>
                        {availableTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3">Your Decks ({filteredDecks.length})</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredDecks.map((deck) => (
                      <div 
                        key={deck.id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedDeck?.id === deck.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-accent'
                        }`}
                        onClick={() => handleDeckSelect(deck)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-foreground">{deck.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {deck.flashcards.length} cards
                              {deck.is_public && <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">Public</span>}
                            </p>
                          </div>
                          <div className="flex gap-1">
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
                        {deck.description && (
                          <p className="text-sm text-muted-foreground mt-2">{deck.description}</p>
                        )}
                        {deck.tags && deck.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deck.tags.map(tag => (
                              <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {deck.user_id === user?.id ? 'Your deck' : 'Shared deck'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flashcard Viewer with Pagination */}
                <div className="lg:w-2/3">
                  {selectedDeck ? (
                    <>
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-semibold text-foreground">{selectedDeck.title}</h2>
                          <div className="flex gap-2">
                            {selectedDeck.is_public && (
                              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded">Public</span>
                            )}
                            {selectedDeck.user_id !== user?.id && (
                              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Shared</span>
                            )}
                          </div>
                        </div>
                        {selectedDeck.description && (
                          <p className="text-muted-foreground mt-1">{selectedDeck.description}</p>
                        )}
                        {selectedDeck.tags && selectedDeck.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedDeck.tags.map(tag => (
                              <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

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
                          {/* Flashcard Grid with Pagination */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {currentCards.map((card, idx) => (
                              <div 
                                key={card.id}
                                className="relative h-40 cursor-pointer [perspective:1000px] select-none"
                                onClick={() => {
                                  setIndex(indexOfFirstCard + idx);
                                  setFlipped(!flipped);
                                }}
                              >
                                <div
                                  className={`absolute inset-0 rounded-2xl shadow-lg p-4 flex flex-col items-center justify-center text-center transition-all duration-500 [transform-style:preserve-3d] ${
                                    flipped && index === indexOfFirstCard + idx ? '[transform:rotateY(180deg)]' : ''
                                  }`}
                                >
                                  {/* Front of card */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-border flex flex-col items-center justify-center [backface-visibility:hidden] p-3">
                                    <span className="text-xs text-primary font-semibold mb-1">QUESTION</span>
                                    <p className="text-sm text-foreground line-clamp-4">{card.front}</p>
                                  </div>
                                  
                                  {/* Back of card */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-2xl border border-border flex flex-col items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] p-3">
                                    <span className="text-xs text-secondary font-semibold mb-1">ANSWER</span>
                                    <p className="text-sm text-foreground line-clamp-4">{card.back}</p>
                                    {card.hint && (
                                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                        <span className="font-medium">Hint:</span> {card.hint}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                              <Button 
                                onClick={() => paginate(currentPage - 1)} 
                                disabled={currentPage === 1}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              
                              <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                  <Button
                                    key={page}
                                    onClick={() => paginate(page)}
                                    variant={currentPage === page ? "default" : "outline"}
                                    className={`w-10 h-10 p-0 ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                                  >
                                    {page}
                                  </Button>
                                ))}
                              </div>
                              
                              <Button 
                                onClick={() => paginate(currentPage + 1)} 
                                disabled={currentPage === totalPages}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {/* Progress indicators */}
                          <div className="flex justify-center mt-6">
                            <div className="flex gap-2">
                              {selectedDeck.flashcards.map((_, i) => (
                                <div 
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i === index 
                                      ? 'bg-primary' 
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
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-foreground mb-2">Select a Deck</h2>
                      <p className="text-muted-foreground">Choose a deck from the list to start studying</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'quizzes':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 mb-6">
              <GraduationCap className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Quizzes</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Test your knowledge with interactive quizzes.
            </p>
            <Button onClick={() => navigate('/quizzes')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Start Quiz
            </Button>
          </div>
        );
      case 'classes':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-6">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Classes</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join and manage your classes and coursework.
            </p>
            <Button onClick={() => navigate('/classes')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              View Classes
            </Button>
          </div>
        );
      case 'forum':
        return (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 mb-6">
              <MessageSquare className="h-12 w-12 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Forum</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Collaborate with peers and teachers in our community forum.
            </p>
            <Button onClick={() => navigate('/forum')} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Join Discussion
            </Button>
          </div>
        );
      case 'settings':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>
            
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{profile?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {userRole}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Profile Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Full Name</label>
                      <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Role</label>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                        {userRole}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          defaultChecked={profile?.email_notifications}
                          className="sr-only"
                        />
                        <div className="block w-10 h-6 rounded-full bg-muted"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform checked:translate-x-4"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Mobile notifications</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          defaultChecked={profile?.push_notifications}
                          className="sr-only"
                        />
                        <div className="block w-10 h-6 rounded-full bg-muted"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform checked:translate-x-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome</h2>
            <p className="text-muted-foreground">Select a section from the sidebar to get started</p>
          </div>
        );
    }
  };

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
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeSection === item.id
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
          <div className="rounded-2xl h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;