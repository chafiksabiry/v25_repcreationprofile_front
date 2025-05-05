import { useState, useEffect } from 'react';
import * as profileApi from '../lib/api/profiles';
import Cookies from 'js-cookie';

export const useProfile = (profileId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedUserId, setFetchedUserId] = useState(null);

  // Helper to get userId from cookie
  const getUserIdFromCookie = () => {
    return Cookies.get('userId');
  };

  // Helper to check token existence
  const hasToken = () => {
    return !!localStorage.getItem('token');
  };

  // The main function to fetch a profile - can be used both inside the hook and exported
  const fetchProfile = async (userId) => {
    // Skip if no userId is provided or no token is available
    if (!userId || !hasToken()) {
      console.error(`Cannot fetch profile: ${!userId ? 'No user ID provided' : 'No authentication token available'}`);
      return null;
    }
    
    // If we've already fetched this profile and it matches the requested userId, return the cached profile
    if (profile && fetchedUserId === userId) {
      console.log(`Using cached profile for user ${userId}`);
      return profile;
    }
    
    try {
      setLoading(true);
      
      // Log the fetch attempt with token info
      if (hasToken()) {
        const token = localStorage.getItem('token');
        console.log(`Fetching profile for user ${userId} with token: ${token.substring(0, 10)}...`);
      }
      
      const data = await profileApi.getProfile(userId);
      
      if (data) {
        console.log('Profile data successfully fetched:', data._id);
        setProfile(data);
        setFetchedUserId(userId);
        setError(null);
      } else {
        console.log('No profile data returned from API');
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch profile if profileId is provided to the hook
  useEffect(() => {
    // Only fetch if profileId is provided, different from the last fetched ID, and we have a token
    if (profileId && profileId !== fetchedUserId && hasToken()) {
      console.log(`Auto-fetching profile for ID: ${profileId}`);
      fetchProfile(profileId);
    }
  }, [profileId, fetchedUserId]);

  // Public getProfile function - this is what components will call
  const getProfile = async (specificUserId) => {
    // If no specific userId provided, try to get it from the cookie
    const userId = specificUserId || getUserIdFromCookie();
    return fetchProfile(userId);
  };

  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      const createdProfile = await profileApi.createProfile(profileData);
      setProfile(createdProfile);
      setError(null);
      return createdProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBasicInfo = async (id, basicInfo) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateBasicInfo(id, basicInfo);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (id, profileData) => {
    try {
      setLoading(true);
      console.log('Sending profile update:', { id, profileData });
      const updatedProfile = await profileApi.updateProfile(id, profileData);
      console.log('Profile update response:', updatedProfile);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExperience = async (id, experience) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateExperience(id, experience);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSkills = async (id, skills) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateSkills(id, skills);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLanguageAssessment = async (id, language, proficiency, results) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateLanguageAssessment(id, {
        language,
        proficiency,
        results
      });
      console.log('updatedProfile after api call : ', updatedProfile);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addAssessment = async (id, assessment) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.addAssessment(id, assessment);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id) => {
    try {
      setLoading(true);
      await profileApi.deleteProfile(id);
      setProfile(null);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addContactCenterAssessment = async (id, assessment) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.addContactCenterAssessment(id, assessment);
      setProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    getProfile,
    createProfile,
    updateBasicInfo,
    updateExperience,
    updateSkills,
    updateLanguageAssessment,
    updateProfileData,
    addAssessment,
    deleteProfile,
    addContactCenterAssessment
  };
};