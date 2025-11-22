import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, BookOpen } from 'lucide-react';

const CATEGORIES = [
  "Mathematics",
  "Science",
  "History",
  "Language",
  "Computer Science",
  "Art",
  "Music",
  "Other"
];

const EditClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{name?: string}>({});

  useEffect(() => {
    const fetchClass = async () => {
      if (!id || !user) return;

      try {
        const { data: classData, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Access Control Check
        const isAdmin = profile?.role === 'admin';
        const isTeacher = classData.teacher_id === user.id;

        if (!isAdmin && !isTeacher) {
          toast.error("You don't have permission to edit this class");
          navigate('/classes');
          return;
        }

        // Populate Form
        setName(classData.name);
        setDescription(classData.description || '');
        setCategory(classData.category || '');

      } catch (error) {
        console.error('Error fetching class:', error);
        toast.error('Failed to load class details');
        navigate('/classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [id, user, profile, navigate]);

  const validate = () => {
    const newErrors: {name?: string} = {};
    if (!name.trim()) {
      newErrors.name = 'Class name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name,
          description,
          category
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Class updated successfully');
      navigate(`/classes`);
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Failed to update class');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/classes')}
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Class</h1>
          <p className="text-muted-foreground">Update class details and settings</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* General Information Section */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>General Information</CardTitle>
            </div>
            <CardDescription>Basic details about your class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Class Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({});
                }}
                placeholder="e.g. Advanced Mathematics 101"
                className={`max-w-xl ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this class is about..."
                className="min-h-[120px] max-w-xl resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="max-w-xl">
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={saving}
            className="w-24"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-38 bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditClass;
