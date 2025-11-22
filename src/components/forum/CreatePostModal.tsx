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
  
  const [touched, setTouched] = useState({
    title: false,
    category: false,
    content: false,
    tags: false
  });

  const isTitleValid = title.trim().length > 0;
  const isCategoryValid = category.length > 0;
  const isContentValid = content.trim().length > 0;
  const isTagsValid = tags.trim().length > 0;

  const isFormValid = isTitleValid && isCategoryValid && isContentValid && isTagsValid;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    setTouched({
      title: true,
      category: true,
      content: true,
      tags: true
    });

    if (!isFormValid) {
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
      setTouched({
        title: false,
        category: false,
        content: false,
        tags: false
      });
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
            <Label htmlFor="title" className="flex gap-1">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur('title')}
              className={`bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 ${touched.title && !isTitleValid ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {touched.title && !isTitleValid && (
              <p className="text-xs text-red-500">Title is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex gap-1">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={category} 
              onValueChange={(val) => {
                setCategory(val);
                if (val) setTouched(prev => ({ ...prev, category: true }));
              }}
            >
              <SelectTrigger 
                className={`bg-white/50 border-gray-200 ${touched.category && !isCategoryValid ? 'border-red-500' : ''}`}
                onBlur={() => handleBlur('category')}
              >
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
            {touched.category && !isCategoryValid && (
              <p className="text-xs text-red-500">Category is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="flex gap-1">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Describe your topic in detail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => handleBlur('content')}
              className={`min-h-[150px] bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 resize-none ${touched.content && !isContentValid ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {touched.content && !isContentValid && (
              <p className="text-xs text-red-500">Content is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="flex gap-1">
              Tags (comma separated) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tags"
              placeholder="math, science, help..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={() => handleBlur('tags')}
              className={`bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 ${touched.tags && !isTagsValid ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {touched.tags && !isTagsValid && (
              <p className="text-xs text-red-500">At least one tag is required</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Discussion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
