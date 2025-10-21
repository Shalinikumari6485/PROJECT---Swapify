import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut, FiPlus, FiMessageCircle, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Swapify</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-teal-600 transition-colors duration-200"
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  to="/create-post" 
                  className="text-gray-600 hover:text-teal-600 transition-colors duration-200 flex items-center space-x-1"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Create Post</span>
                </Link>
                
                <Link 
                  to="/chat" 
                  className="text-gray-600 hover:text-teal-600 transition-colors duration-200 flex items-center space-x-1"
                >
                  <FiMessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{user?.name}</p>
                    <p className="text-gray-500 text-xs">
                      {user?.badges?.length > 0 && (
                        <span className="badge badge-newbie">
                          {user.badges[user.badges.length - 1]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors duration-200">
                    <FiSettings className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link 
                        to={`/profile/${user?.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        View Profile
                      </Link>
                      
                      {user?.isAdmin && (
                        <Link 
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-teal-600 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
