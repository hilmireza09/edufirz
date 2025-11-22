import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, ThumbsUp, MessageSquare, CheckCircle, 
  MoreVertical, Trash2, Flag, Share2 
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Reply = {
  id: string;
  content: string;
  created_at: string;
  upvotes: number;
  user_vote?: 'up' | null;
  is_solution: boolean;
  author_id: string;
  author: {
    full_name: string;
    email: string;
  };
};

type PostDetail = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  user_vote?: 'up' | null;
  created_at: string;
  is_solved: boolean;
  author_id: string;
  author: {
    full_name: string;
    email: string;
  };
};

export default function ForumPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostAndReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user]);

  const fetchPostAndReplies = async () => {
    try {
      // Fetch Post
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles(full_name, email)
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      // Fetch Post Votes
      const { data: postVotes } = await supabase
        .from('forum_post_votes')
        .select('*')
        .eq('post_id', postId);

      const postUpvotes = postVotes?.filter(v => v.vote_type === 'up').length || 0;
      const postUserVote = user ? postVotes?.find(v => v.user_id === user.id)?.vote_type : null;

      setPost({
        ...postData,
        upvotes: postUpvotes,
        user_vote: (postUserVote === 'up' ? 'up' : null) as 'up' | null
      });

      // Fetch Replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:profiles(full_name, email)
        `)
        .eq('post_id', postId)
        .order('is_solution', { ascending: false }) // Solutions first
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      if (repliesData && repliesData.length > 0) {
        const replyIds = repliesData.map(r => r.id);
        const { data: replyVotes } = await supabase
          .from('forum_reply_votes')
          .select('*')
          .in('reply_id', replyIds);
        
        const processedReplies = repliesData.map(reply => {
          const rVotes = replyVotes?.filter(v => v.reply_id === reply.id) || [];
          return {
            ...reply,
            upvotes: rVotes.filter(v => v.vote_type === 'up').length,
            user_vote: user ? (rVotes.find(v => v.user_id === user.id)?.vote_type === 'up' ? 'up' : null) : null
          } as Reply;
        });
        setReplies(processedReplies);
      } else {
        setReplies(repliesData as unknown as Reply[] || []);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load discussion');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (targetId: string, isReply: boolean = false) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    // Get current vote state for logic
    let currentVote: 'up' | null | undefined;
    if (isReply) {
      currentVote = replies.find(r => r.id === targetId)?.user_vote;
    } else {
      currentVote = post?.user_vote;
    }

    // Optimistic update
    if (isReply) {
      setReplies(prev => prev.map(r => {
        if (r.id !== targetId) return r;
        
        const oldVote = r.user_vote;
        let newUpvotes = r.upvotes;
        let newVote = oldVote;

        if (oldVote === 'up') {
          newVote = null;
          newUpvotes--;
        } else {
          newVote = 'up';
          newUpvotes++;
        }
        return { ...r, upvotes: newUpvotes, user_vote: newVote };
      }));
    } else {
      setPost(prev => {
        if (!prev) return null;
        const oldVote = prev.user_vote;
        let newUpvotes = prev.upvotes;
        let newVote = oldVote;

        if (oldVote === 'up') {
          newVote = null;
          newUpvotes--;
        } else {
          newVote = 'up';
          newUpvotes++;
        }
        return { ...prev, upvotes: newUpvotes, user_vote: newVote };
      });
    }

    try {
      const table = isReply ? 'forum_reply_votes' : 'forum_post_votes';
      const idField = isReply ? 'reply_id' : 'post_id';

      if (currentVote === 'up') {
        await supabase.from(table).delete().eq(idField, targetId).eq('user_id', user.id);
      } else {
        await supabase.from(table).upsert({ [idField]: targetId, user_id: user.id, vote_type: 'up' });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
      fetchPostAndReplies(); // Revert on error
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newReply,
          votes: 0
        });

      if (error) throw error;

      // Update reply count on post
      await supabase.rpc('increment_reply_count', { row_id: postId }); 
      // Fallback if RPC doesn't exist, just ignore or do manual update
      // We'll just refetch for now to be safe

      setNewReply('');
      fetchPostAndReplies();
      toast.success('Reply posted');
    } catch (error) {
      console.error('Error replying:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSolution = async (replyId: string) => {
    try {
      await supabase
        .from('forum_replies')
        .update({ is_solution: true })
        .eq('id', replyId);
      
      await supabase
        .from('forum_posts')
        .update({ is_solved: true })
        .eq('id', postId);

      fetchPostAndReplies();
      toast.success('Marked as solution');
    } catch (error) {
      toast.error('Failed to mark solution');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading discussion...</div>;
  if (!post) return <div className="p-8 text-center">Discussion not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <Button variant="ghost" onClick={() => navigate('/forum')} className="mb-4 hover:bg-white/50">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discussions
      </Button>

      {/* Main Post */}
      <Card className="border-primary/10 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="h-1 bg-gradient-to-r from-primary/50 to-purple-600/50" />
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                  {post.category}
                </Badge>
                {post.is_solved && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 px-3 py-1">
                    <CheckCircle className="h-3 w-3" /> Solved
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                {post.title}
              </CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-full">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{post.author?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-700">{post.author?.full_name}</span>
                </div>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            
            {/* Post Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary/50">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem><Share2 className="mr-2 h-4 w-4" /> Share</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600"><Flag className="mr-2 h-4 w-4" /> Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
          
          {post.tags && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md border border-secondary">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Separator className="bg-border/50" />

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => handleVote(post.id)}
              className={cn("gap-1 px-2 h-8", post.user_vote === 'up' && "text-primary bg-primary/10")}
            >
              <ThumbsUp className={cn("h-4 w-4", post.user_vote === 'up' && "fill-current")} />
              {post.upvotes} Upvotes
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground text-sm px-3 py-1.5 rounded-md bg-secondary/30">
              <MessageSquare className="h-4 w-4" />
              {replies.length} Replies
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold text-gray-700 px-1 flex items-center gap-2">
          Replies <span className="text-sm font-normal text-muted-foreground">({replies.length})</span>
        </h3>
        
        {replies.map((reply, index) => (
          <Card 
            key={reply.id} 
            className={`border-white/20 backdrop-blur-sm transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards ${
              reply.is_solution 
                ? 'bg-green-50/80 border-green-200 shadow-[0_0_20px_-5px_rgba(34,197,94,0.2)]' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarFallback>{reply.author?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{reply.author?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {reply.is_solution && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-sm">
                    <CheckCircle className="mr-1 h-3 w-3" /> Solution
                  </Badge>
                )}
              </div>
              
              <div className="text-gray-700 whitespace-pre-wrap mb-4 pl-11 leading-relaxed">
                {reply.content}
              </div>

              <div className="flex items-center justify-between pl-11">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-8 gap-1", reply.user_vote === 'up' && "text-primary bg-primary/5")}
                    onClick={() => handleVote(reply.id, true)}
                  >
                    <ThumbsUp className={cn("mr-1 h-3 w-3", reply.user_vote === 'up' && "fill-current")} /> 
                    {reply.upvotes}
                  </Button>
                </div>
                
                {/* Only show if user is author of post and not solved yet */}
                {user?.id === post.author_id && !post.is_solved && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 border-green-200 hover:bg-green-50 transition-colors"
                    onClick={() => handleMarkSolution(reply.id)}
                  >
                    <CheckCircle className="mr-2 h-3 w-3" /> Mark as Solution
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Input Area - Moved from fixed bottom to inline */}
      <div className="mt-8 mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
        <Card className="border-primary/10 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              Write a reply
            </h3>
            <div className="relative">
              <Textarea 
                placeholder="What are your thoughts? (Markdown supported)" 
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="min-h-[120px] bg-white/50 resize-y border-primary/10 focus:border-primary/30 focus:ring-0 transition-all duration-300"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button 
                  onClick={handleSubmitReply} 
                  disabled={submitting || !newReply.trim()}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
