import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ForumPostList from '@/components/forum/ForumPostList';
import ForumPostDetail from '@/components/forum/ForumPostDetail';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';



const Forum = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        {/* Forum Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-background to-muted">
          <Routes>
            <Route path="/" element={<ForumPostList />} />
            <Route path="/:postId" element={<ForumPostDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Forum;



