import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import CreateDeck from "./pages/CreateDeck";
import Quizzes from "./pages/Quizzes";
import QuizTake from "./pages/QuizTake";
import QuizReview from "./pages/QuizReview";
import Classes from "./pages/Classes";
import ClassDetails from "./pages/ClassDetails";
import Forum from "./pages/Forum";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/flashcards" 
              element={
                <ProtectedRoute>
                  <Flashcards />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/flashcards/new" 
              element={
                <ProtectedRoute>
                  <CreateDeck />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quizzes" 
              element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quizzes/:id/take" 
              element={
                <ProtectedRoute>
                  <QuizTake />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quizzes/:id/review/:attemptId" 
              element={
                <ProtectedRoute>
                  <QuizReview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classes" 
              element={
                <ProtectedRoute>
                  <Classes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classes/:id/*" 
              element={
                <ProtectedRoute>
                  <ClassDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forum/*" 
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
