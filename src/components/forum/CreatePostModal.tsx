import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

const CATEGORIES = [
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'Government',
  'Social',
  'Economics',
  'Arts',
  'Technology',
  'English',
  'Others'
];

export function CreatePostModal({ open, onOpenChange, onPostCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      const { error } = await supabase
        .from('forum_posts')
        .insert({
          title,
          content,
          category,
          tags: tagArray,
          author_id: user.id,
          votes: 0,
          reply_count: 0
        });

      if (error) throw error;

      toast.success('Post created successfully!');
      onPostCreated();
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Create New Discussion
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/50 border-gray-200">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Describe your topic in detail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="math, science, help..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Discussion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
