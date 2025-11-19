import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Search, Plus, Filter, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 border-white/20 focus:bg-white/80 transition-all"
          />
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
          filteredPosts.map((post) => (
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
          ))
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
