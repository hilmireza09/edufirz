
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast({
          title: "Error fetching user",
          description: error.message,
          variant: "destructive",
        });
        navigate("/login");
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [navigate, toast]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out successfully",
      });
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Welcome to your Dashboard</CardTitle>
              <CardDescription>{user ? `Logged in as ${user.email}` : ""}</CardDescription>
            </div>
            <Button onClick={handleLogout} className="rounded-full">
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Your Learning Hub</h2>
            <p className="mt-2 text-gray-600">
              Your enrolled courses, progress, and learning materials will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
