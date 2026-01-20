import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Simple request deduplication cache
const pendingRequests = new Map();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json' //json
  }
});

const apiMultipart = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Helper function to generate a request key
const getRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Add token to every request
api.interceptors.request.use(config => {
  // Always get the fresh token from localStorage
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Adding token to request:', config.url);
  } else {
    console.warn('No token available for request:', config.url);
  }

  // Deduplicate GET requests within a short time window
  if (config.method.toLowerCase() === 'get') {
    const key = getRequestKey(config);
    const pendingRequest = pendingRequests.get(key);

    if (pendingRequest) {
      console.log(`Deduplicating request: ${key}`);
      return Promise.reject({
        __DEDUPLICATED__: true,
        __ORIGINAL_PROMISE__: pendingRequest
      });
    }

    // Store this request in the pending requests map
    const promise = new Promise((resolve, reject) => {
      // Add the resolver and rejecter to the config so we can use them in the response interceptor
      config.__RESOLVE__ = resolve;
      config.__REJECT__ = reject;
    });

    pendingRequests.set(key, promise);

    // Set expiration for this request key
    setTimeout(() => {
      pendingRequests.delete(key);
    }, 500); // 500ms window for deduplication
  }

  return config;
}, error => {
  return Promise.reject(error);
});

apiMultipart.interceptors.request.use(config => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for handling common errors and deduplication
api.interceptors.response.use(
  response => {
    // If this was a GET request, resolve any pending promises
    if (response.config.method.toLowerCase() === 'get') {
      const key = getRequestKey(response.config);
      if (response.config.__RESOLVE__) {
        response.config.__RESOLVE__(response);
      }
      pendingRequests.delete(key);
    }
    return response;
  },
  error => {
    // Check if this is a deduplicated request
    if (error.__DEDUPLICATED__ && error.__ORIGINAL_PROMISE__) {
      return error.__ORIGINAL_PROMISE__;
    }

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error. Token may be invalid.');
      // You might want to redirect to login or refresh token here
    }

    // If this was a GET request that failed, clean up pending promises
    if (error.config && error.config.method && error.config.method.toLowerCase() === 'get') {
      const key = getRequestKey(error.config);
      if (error.config.__REJECT__) {
        error.config.__REJECT__(error);
      }
      pendingRequests.delete(key);
    }

    return Promise.reject(error);
  }
);

export default api;
export { apiMultipart };