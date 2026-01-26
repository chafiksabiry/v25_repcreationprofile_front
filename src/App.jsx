import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ImportDialog from './ImportDialog';
import SummaryEditor from './SummaryEditor';
import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { getProfile, loading: profileLoading } = useProfile();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  let userId = null;
  const hasNavigated = useRef(false); // Ref to track if navigation has occurred
  const initAttempted = useRef(false); // Ref to track if initialization was attempted

  // Initialize authentication and fetch profile - only runs once
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initAttempted.current) return;
    initAttempted.current = true;

    const initialize = async () => {
      try {
        // If running in standalone mode, use the user ID from the environment variable
        if (import.meta.env.VITE_RUN_MODE === 'standalone') {
          userId = import.meta.env.VITE_STANDALONE_USER_ID;
        } else {
          // If running in in-app mode, try to get the user ID from cookies
          const cookieUserId = Cookies.get('userId');
          if (cookieUserId) {
            console.log("userId from cookies:", cookieUserId);
            userId = cookieUserId;
          } else {
            console.error("No user ID found in cookies");
            setIsInitializing(false);
            return;
          }
        }

        console.log("Starting initialization for user:", userId);

        // Step 1: Generate and store token
        const tokenResponse = await api.post('/auth/generate-token', { userId });
        if (tokenResponse?.data?.token) {
          // Step 2: Store token and userId directly
          localStorage.setItem('token', tokenResponse.data.token);
          Cookies.set('userId', userId, {
            expires: 7, // 7 jours
            secure: window.location.protocol === 'https:',
            sameSite: 'lax'
          });
          console.log("Token generated and stored successfully");

          // Step 3: Now that we have a token, fetch the profile
          const profileData = await getProfile(userId);
          console.log("Profile fetched:", profileData ? "Success" : "Not found");

          // Set the profile data regardless of navigation
          if (profileData) {
            setProfileData(profileData);
          }

          // Step 3: Route to the appropriate page based on profile status - but only once
          if (!hasNavigated.current) {
            hasNavigated.current = true; // Mark that we've navigated

            // In standalone mode, always navigate to profile-import
            /* if (import.meta.env.VITE_RUN_MODE === 'standalone') {
              console.log("Standalone mode: redirecting to profile import");
              if (location.pathname !== '/profile-import') {
                navigate('/profile-import');
              }
            } else { */
            // Normal navigation rules for non-standalone mode
            if (profileData?.isBasicProfileCompleted) {
              // User has completed their profile - redirect to dashboard
              console.log("Profile complete, redirecting to dashboard");
              const profileUrl = import.meta.env.VITE_RUN_MODE === 'standalone'
                ? import.meta.env.VITE_REP_ORCHESTRATOR_URL_STANDALONE
                : import.meta.env.VITE_REP_ORCHESTRATOR_URL;
              window.location.href = profileUrl;
              return; // Exit early to prevent further state updates
            } else if (profileData?.personalInfo?.name) {
              // Profile exists but incomplete - go to editor if not already there
              if (location.pathname !== '/profile-editor') {
                console.log("Profile exists but incomplete, navigating to editor");
                navigate('/profile-editor');
              }
            } else {
              // New profile or minimal data - go to import if not already there
              if (location.pathname !== '/profile-import') {
                console.log("New profile, navigating to import page");
                navigate('/profile-import');
              }
            }
            //}
          } else {
            console.log("Navigation already happened, skipping route change");
          }
        } else {
          console.error("Failed to obtain token");
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
    // Only depend on userId - explicitly avoid adding navigate, location, getProfile as dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset navigation flag when location changes
  useEffect(() => {
    console.log("Location changed to:", location.pathname);
    // We don't reset hasNavigated.current here anymore, as we want it to stay true once navigation happens
  }, [location]);

  // Handle profile data updates from import dialog
  const handleProfileData = (data) => {
    const { generatedSummary, ...profileInfo } = data;
    setProfileData(profileInfo);
    setGeneratedSummary(generatedSummary || '');

    // After importing/creating profile, go to editor
    hasNavigated.current = true; // Mark that we're navigating
    navigate('/profile-editor');
  };



  // Show loading during initialization
  if (isInitializing) {
    return <Loading />;
  }

  // Render the appropriate page based on current route
  const currentPath = location.pathname;

  // Import page
  if (currentPath === '/profile-import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <TopBar />
        <div className="flex-1 pt-12 pb-12 px-4 sm:px-6 lg:px-8">
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
      </div>
    );
  }

  // Editor page
  if (currentPath === '/profile-editor') {
    // Show loading if we're on the editor page but don't have profile data yet
    if (profileLoading && !profileData) {
      return <Loading />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="pt-48 pb-12 px-4 sm:px-6 lg:px-8">
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
      </div>
    );
  }

  // Default case
  return <Navigate to="/profile-import" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.VITE_RUN_MODE === 'standalone' ? '/' : '/repcreationprofile'}>
        <Routes>
          {/* Old route preserved for compatibility */}
          <Route path="/profile-wizard" element={<Navigate to="/profile-import" replace />} />

          {/* Protected routes - require authentication */}
          <Route path="/profile-import" element={
            <ProtectedRoute>
              <ProfileRouter />
            </ProtectedRoute>
          } />
          <Route path="/profile-editor" element={
            <ProtectedRoute>
              <ProfileRouter />
            </ProtectedRoute>
          } />

          {/* Default route */}
          <Route path="*" element={<Navigate to="/profile-import" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;