import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquarePlus, Send } from 'lucide-react';

type Post = {
  id: number;
  author: string;
  role: string;
  content: string;
  likes: number;
  replies: number;
};

const initialPosts: Post[] = [
  { id: 1, author: 'Sarah Chen', role: 'student', content: 'Any tips for mastering derivatives? I struggle with chain rule.', likes: 12, replies: 4 },
  { id: 2, author: 'Mr. Patel', role: 'teacher', content: 'I will host a review session Friday 5pm. Bring your questions!', likes: 22, replies: 7 },
  { id: 3, author: 'Diego Ramirez', role: 'student', content: 'Sharing a great resource I found for verb conjugations.', likes: 8, replies: 2 },
];

const Forum = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState('');

  const handleAddPost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now(),
      author: 'You',
      role: 'student',
      content: newPost.trim(),
      likes: 0,
      replies: 0,
    };
    setPosts([post, ...posts]);
    setNewPost('');

  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <MessageSquarePlus className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">Collaborative forum</span>
          </div>
        </div>

        {/* Composer */}
        <div className="glass-card rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-semibold">
              Y
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share an idea, ask a question, or start a discussion..."
                className="w-full bg-transparent outline-none resize-none min-h-[80px] text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex justify-end mt-3">
                <Button onClick={handleAddPost} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="glass-card rounded-2xl p-5 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {post.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{post.author}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary-foreground/80 capitalize">
                      {post.role}
                    </span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed">{post.content}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="hover:text-accent transition-colors">👍 {post.likes}</button>
                    <button className="hover:text-accent transition-colors">💬 {post.replies}</button>
                    <button className="hover:text-accent transition-colors">↩ Reply</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Forum;



