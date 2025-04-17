import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ImportDialog from './ImportDialog';
import SummaryEditor from './SummaryEditor';
import api from './lib/api/client';
import Cookies from 'js-cookie';
import { useProfile } from './hooks/useProfile';

// Loading component to show while checking profile status
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading your profile...</p>
    </div>
  </div>
);

// Profile router component to handle conditional routing based on profile status
function ProfileRouter() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { getProfile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const initialFetchDone = useRef(false);
  const userId = Cookies.get('userId');
  
  // Handle authentication token once, on component mount
  useEffect(() => {
    const initializeToken = async () => {
      try {
        if (!userId) {
          console.error("No user ID found in cookies");
          return;
        }
        
        console.log("Using user ID from cookie:", userId);
        
        // Only generate token if not already present
        if (!localStorage.getItem('token')) {
          const { data } = await api.post('/auth/generate-token', { userId });
          
          if (data?.token) {
            localStorage.setItem('token', data.token);
            console.log("Token generated and stored");
          }
        } else {
          console.log("Token already exists");
        }
      } catch (error) {
        console.error('Failed to initialize token:', error.message);
      }
    };
    
    initializeToken();
  }, [userId]);
  
  // Fetch profile only once on initial load
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Skip if we've already fetched or no userId is available
      if (initialFetchDone.current || !userId) return;
      
      try {
        console.log("Fetching user profile for userId:", userId);
        setLoading(true);
        const data = await getProfile(userId);
        initialFetchDone.current = true;
        
        console.log("Profile data fetched:", data);
        
        if (data) {
          setProfileData(data);
          
          // Check profile status and redirect accordingly - but only if location needs to change
          if (data.isBasicProfileCompleted) {
            // If profile is complete, redirect to dashboard
            console.log("Profile complete, redirecting to dashboard");
            window.location.href = 'http://localhost:5183/profile';
            return;
          } else if (data.personalInfo?.name && location.pathname !== '/profile-editor') {
            // If profile exists but not complete, go to editor
            console.log("Profile exists but incomplete, navigating to editor");
            navigate('/profile-editor');
          } else if (!data.personalInfo?.name && location.pathname !== '/profile-import') {
            // New user, go to import page
            console.log("New profile, navigating to import page");
            navigate('/profile-import');
          } else {
            console.log("User is already on the correct page");
          }
        } else {
          // No profile found, go to import page
          if (location.pathname !== '/profile-import') {
            console.log("No profile found, navigating to import page");
            navigate('/profile-import');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // On error, default to import page if not already there
        if (location.pathname !== '/profile-import') {
          navigate('/profile-import');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate, getProfile, location.pathname, userId]);
  
  const handleProfileData = (data) => {
    const { generatedSummary, ...profileInfo } = data;
    setProfileData(profileInfo);
    setGeneratedSummary(generatedSummary || '');
    
    // After importing/creating profile, go to editor
    navigate('/profile-editor');
  };

  // Avoid showing loading indicator if we already have profile data
  // This prevents flashing of loading state during navigation between pages
  if (loading && !profileData) {
    return <Loading />;
  }
  
  // Return the appropriate route component based on current URL
  const currentPath = location.pathname;
  
  // Only used for the "/profile-import" route
  if (currentPath === '/profile-import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
                <h1 className="relative bg-white px-8 py-4 rounded-lg text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  HARX REPS Profile Wizard ✨
                </h1>
              </div>
            </div>
            <p className="text-xl text-gray-600 mb-4">
              Transform your CV into a captivating professional story
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Powered by AI magic 🪄 | REPS Framework: Role • Experience • Projects • Skills
            </p>
          </div>

          <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Stand Out?</h3>
              <p className="text-gray-600 max-w-sm mx-auto mb-8">
                Connect with LinkedIn or upload your CV to create your personalized professional summary
              </p>
              <button
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Let's Get Started
              </button>
              <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>🚀 Instant Analysis</span>
                <span>•</span>
                <span>✨ AI-Powered</span>
                <span>•</span>
                <span>🔒 Secure</span>
              </div>
            </div>
          </div>

          <ImportDialog
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onImport={handleProfileData}
          />
        </div>
      </div>
    );
  }
  
  // Only used for the "/profile-editor" route
  if (currentPath === '/profile-editor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
                <h1 className="relative bg-white px-8 py-4 rounded-lg text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  HARX REPS Profile Wizard ✨
                </h1>
              </div>
            </div>
            <p className="text-xl text-gray-600 mb-4">
              Transform your CV into a captivating professional story
            </p>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Powered by AI magic 🪄 | REPS Framework: Role • Experience • Projects • Skills
            </p>
          </div>

          {profileData ? (
            <SummaryEditor
              profileData={profileData}
              generatedSummary={generatedSummary}
              setGeneratedSummary={setGeneratedSummary}
              onProfileUpdate={handleProfileData}
            />
          ) : (
            <div className="text-center py-12">
              <Loading />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Default case
  return <Navigate to="/profile-import" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Old route preserved for compatibility */}
        <Route path="/profile-wizard" element={<Navigate to="/profile-import" replace />} />
        
        {/* New specific routes */}
        <Route path="/profile-import" element={<ProfileRouter />} />
        <Route path="/profile-editor" element={<ProfileRouter />} />
        
        {/* Default route */}
        <Route path="*" element={<Navigate to="/profile-import" replace />} />
      </Routes>
    </Router>
  );
}

export default App;