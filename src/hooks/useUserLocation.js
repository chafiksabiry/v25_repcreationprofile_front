import { useState, useEffect } from 'react';
import api from '../lib/api/client';
import Cookies from 'js-cookie';

export const useUserLocation = (userId) => {
  const [locationData, setLocationData] = useState(null);
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

  // The main function to fetch user location from IP
  const fetchUserLocation = async (specificUserId) => {
    const userIdToUse = specificUserId || getUserIdFromCookie();
    
    // Skip if no userId is provided or no token is available
    if (!userIdToUse || !hasToken()) {
      console.error(`Cannot fetch location: ${!userIdToUse ? 'No user ID provided' : 'No authentication token available'}`);
      return null;
    }
    
    // If we've already fetched this user's location, return the cached data
    if (locationData && fetchedUserId === userIdToUse) {
      console.log(`Using cached location data for user ${userIdToUse}`);
      return locationData;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching location data for user ${userIdToUse} from IP endpoint`);
      
      const { data } = await api.get(`/ip/user/${userIdToUse}/latest`);
      
      if (data && data.locationInfo) {
        console.log('Location data successfully fetched:', data.locationInfo);
        setLocationData(data);
        setFetchedUserId(userIdToUse);
        setError(null);
        return data;
      } else {
        console.log('No location data returned from IP endpoint');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user location:', err);
      setError(err.message || 'Failed to fetch location data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch location if userId is provided to the hook
  useEffect(() => {
    if (userId && userId !== fetchedUserId && hasToken()) {
      console.log(`Auto-fetching location for user ID: ${userId}`);
      fetchUserLocation(userId);
    }
  }, [userId, fetchedUserId]);

  // Public getUserLocation function - this is what components will call
  const getUserLocation = async (specificUserId) => {
    return fetchUserLocation(specificUserId);
  };

  // Helper function to get country code from location data
  const getCountryCode = () => {
    return locationData?.locationInfo?.countryCode || null;
  };

  // Helper function to get full location info
  const getLocationInfo = () => {
    return locationData?.locationInfo || null;
  };

  // Helper function to create a country object compatible with existing system
  const createCountryFromLocationInfo = () => {
    const locationInfo = getLocationInfo();
    if (!locationInfo || !locationInfo.countryCode) return null;
    
    return {
      countryCode: locationInfo.countryCode,
      countryName: locationInfo.country || locationInfo.countryCode,
      region: locationInfo.region,
      city: locationInfo.city,
      timezone: locationInfo.timezone
    };
  };

  return {
    locationData,
    loading,
    error,
    getUserLocation,
    getCountryCode,
    getLocationInfo,
    createCountryFromLocationInfo,
    // Expose the fetched data for direct access
    countryCode: getCountryCode(),
    locationInfo: getLocationInfo(),
    countryObject: createCountryFromLocationInfo()
  };
}; 