import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageSquare, ThumbsUp, Search, Plus, Filter, Clock, Check, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreatePostModal } from './CreatePostModal';

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  votes: number;
  reply_count: number;
  created_at: string;
  is_solved: boolean;
  author: {
    full_name: string;
    email: string;
  };
};

export default function ForumPostList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [open, setOpen] = useState(false);

  // Pagination - 10 posts per page
  const postsPerPage = 10;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel('public:forum_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique tags
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags || []))).sort();

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedFilter === 'All') return matchesSearch;
    if (selectedFilter === 'Solved') return matchesSearch && post.is_solved;
    if (selectedFilter === 'Unsolved') return matchesSearch && !post.is_solved;
    
    // For categories
    if (['General', 'Help', 'Study Tips'].includes(selectedFilter)) {
      return matchesSearch && post.category === selectedFilter;
    }

    // For tags
    return matchesSearch && post.tags?.includes(selectedFilter);
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  // Reset to page 1 when search or filter changes
  const prevSearchQuery = useRef(searchQuery);
  const prevSelectedFilter = useRef(selectedFilter);
  
  useEffect(() => {
    if (prevSearchQuery.current !== searchQuery || prevSelectedFilter.current !== selectedFilter) {
      if (currentPage > 1) {
        setSearchParams({ page: '1' });
      }
      prevSearchQuery.current = searchQuery;
      prevSelectedFilter.current = selectedFilter;
    }
  }, [searchQuery, selectedFilter, currentPage, setSearchParams]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 border-white/20 focus:bg-white/80 transition-all"
            />
          </div>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="bg-white/50 border-white/20 hover:bg-white/80 gap-2 min-w-[140px] justify-between backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{selectedFilter}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[200px] p-0 bg-white/90 backdrop-blur-xl border-white/20">
              <Command>
                <CommandInput placeholder="Search filters..." />
                <CommandList>
                  <CommandEmpty>No filter found.</CommandEmpty>
                  <CommandGroup heading="Status">
                    <CommandItem
                      onSelect={() => {
                        setSelectedFilter('All');
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFilter === 'All' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Posts
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setSelectedFilter('Solved');
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFilter === 'Solved' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Solved
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setSelectedFilter('Unsolved');
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFilter === 'Unsolved' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Unsolved
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Categories">
                    {['General', 'Help', 'Study Tips'].map((category) => (
                      <CommandItem
                        key={category}
                        onSelect={() => {
                          setSelectedFilter(category);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFilter === category ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Tags">
                    {allTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        onSelect={() => {
                          setSelectedFilter(tag);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFilter === tag ? "opacity-100" : "opacity-0"
                          )}
                        />
                        #{tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Discussion
        </Button>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading discussions...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white/30 rounded-xl border border-white/20">
            No discussions found. Be the first to start one!
          </div>
        ) : (
          <>
            {paginatedPosts.map((post) => (
              <Card 
                key={post.id}
                onClick={() => navigate(`/forum/${post.id}`)}
                className="group cursor-pointer border-white/20 bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.15)] hover:-translate-y-1"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {post.category || 'General'}
                        </Badge>
                        {post.is_solved && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Solved
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {post.content}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground bg-black/5 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {post.author?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author?.full_name || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.votes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.reply_count || 0}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-xl p-0 ${page === currentPage ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25' : 'glass-card hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm border-white/20'}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="glass-card border-white/20 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm rounded-xl"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreatePostModal 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onPostCreated={fetchPosts}
      />
    </div>
  );
}
