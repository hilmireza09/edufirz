import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    // Use profile from useAuth instead of fetching
    if (profile) {
      setProfile(profile);
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-background to-muted">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account preferences and settings
              </p>
            </div>

            <div className="grid gap-6">
              {/* Profile Settings */}
              <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter your full name"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails about your account activity
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
