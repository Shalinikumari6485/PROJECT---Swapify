import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import PostDetails from './pages/PostDetails';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/post/:id" element={<PostDetails />} />
            <Route path="/profile/:id" element={<Profile />} />
            
            {/* Protected routes */}
            <Route 
              path="/create-post" 
              element={isAuthenticated ? <CreatePost /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/chat" 
              element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/chat/:chatId" 
              element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
