import api from './client';

/**
 * Get user's latest IP location data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Location data with IP info
 */
export const getUserLatestLocation = async (userId) => {
  try {
    console.log(`Fetching latest location for user: ${userId}`);
    const { data } = await api.get(`/ip/user/${userId}/latest`);
    return data;
  } catch (error) {
    console.error(`Error fetching location for user ${userId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get user's IP history
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of IP location records
 */
export const getUserLocationHistory = async (userId) => {
  try {
    console.log(`Fetching location history for user: ${userId}`);
    const { data } = await api.get(`/ip/user/${userId}/history`);
    return data;
  } catch (error) {
    console.error(`Error fetching location history for user ${userId}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get location info for a specific IP
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - Location data for the IP
 */
export const getIpLocationInfo = async (ipAddress) => {
  try {
    console.log(`Fetching location info for IP: ${ipAddress}`);
    const { data } = await api.get(`/ip/info/${ipAddress}`);
    return data;
  } catch (error) {
    console.error(`Error fetching location info for IP ${ipAddress}:`, error);
    throw error.response?.data || error;
  }
}; 