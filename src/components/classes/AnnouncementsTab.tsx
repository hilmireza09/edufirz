import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Plus, Trash2, Edit2, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    full_name: string;
    email: string;
  };
};

const AnnouncementsTab = () => {
  const { id: classId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');

  // Use profile from useAuth
  useEffect(() => {
    if (profile) {
      setUserRole(profile.role || 'student');
    }
  }, [profile]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('class_announcements')
        .select(`
          *,
          author:profiles(full_name, email)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (user && classId && classId !== 'undefined') {
      fetchAnnouncements();
    }
  }, [classId, user, fetchAnnouncements]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('class_announcements')
        .insert({
          class_id: classId,
          author_id: user?.id,
          title: newTitle,
          content: newContent
        });

      if (error) throw error;

      toast.success('Announcement posted');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from('class_announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      toast.success('Announcement deleted');
      setAnnouncements(announcements.filter(a => a.id !== announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const canManage = userRole === 'teacher' || userRole === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Create Banner */}
      {canManage && (
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all duration-300 border-primary/20 bg-white/5 backdrop-blur-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground">Announce something to your class...</p>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden border-l-4 border-l-primary bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {announcement.author?.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-semibold text-primary/90">
                        {announcement.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{announcement.author?.full_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {canManage && user?.id === announcement.author_id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(announcement.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              New Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g. Midterm Exam Schedule"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-card/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your announcement here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[150px] bg-card/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-gradient-to-r from-primary to-secondary">
              {submitting ? 'Posting...' : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementsTab;