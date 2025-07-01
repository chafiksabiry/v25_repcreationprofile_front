import api from './client';

export const getProfile = async (userId) => {
  try {
    // If userId is provided, use it to fetch a specific profile
    const endpoint = userId ? `/profiles/${userId}` : '/profiles';
    console.log(`Making API request to: ${endpoint}`);
    const { data } = await api.get(endpoint);
    return data;
  } catch (error) {
    console.error(`Error fetching profile${userId ? ` for user ${userId}` : ''}:`, error);
    throw error.response?.data || error;
  }
};

export const createProfile = async (profileData) => {
  try {
    const { data } = await api.post('/profiles', profileData);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBasicInfo = async (id, basicInfo) => {
  try {
    const { data } = await api.put(`/profiles/${id}/basic-info`, basicInfo);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateExperience = async (id, experience) => {
  try {
    const { data } = await api.put(`/profiles/${id}/experience`, { experience });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSkills = async (id, skills) => {
  try {
    const { data } = await api.put(`/profiles/${id}/skills`, { skills });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateLanguageAssessment = async (id, data) => {
  try {
    const { data: response } = await api.post(`/profiles/${id}/language-assessment`, data);
    return response;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addAssessment = async (id, assessment) => {
  try {
    const { data } = await api.post(`/profiles/${id}/assessment`, assessment);
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteProfile = async () => {
  try {
    const { data } = await api.delete('/profiles');
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProfile = async (id, profileData) => {
  try {
    const response = await api.put(`/profiles/${id}`, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add new function to handle contact center assessment
export const addContactCenterAssessment = async (id, assessment) => {
  try {
    const { data } = await api.post(`/profiles/${id}/contact-center-assessment`, { assessment });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add checkProfileExists function
export const checkProfileExists = async (userId) => {
  try {
    const endpoint = userId ? `/profiles/${userId}/exists` : '/profiles/exists';
    console.log(`Checking if profile exists: ${endpoint}`);
    const { data } = await api.get(endpoint);
    return data.exists;
  } catch (error) {
    console.error(`Error checking profile existence${userId ? ` for user ${userId}` : ''}:`, error);
    return false;
  }
};

// Add getTimezones function
export const getTimezones = async () => {
  try {
    console.log('Fetching timezones from API');
    const { data } = await api.get('/timezones');
    return data.data; // Return the data array from the response
  } catch (error) {
    console.error('Error fetching timezones:', error);
    throw error.response?.data || error;
  }
};