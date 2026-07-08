/**
 * API Configuration
 * 
 * Determines the backend API endpoint based on environment
 * - Development: Uses Vite proxy to http://localhost:8080
 * - Production: Uses environment variable or current origin
 */

const isDevelopment = import.meta.env.DEV;

// Get API endpoint from environment variable or determine dynamically
const getApiEndpoint = () => {
  // Check for environment variable (set during build or runtime)
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    return envApi;
  }

  // Development: Use Vite proxy
  if (isDevelopment) {
    return 'http://localhost:5173'; // Vite will proxy /api to backend
  }

  // Production: Assume backend is on same server or use origin
  // This allows flexibility for different deployment scenarios
  const origin = window.location.origin;
  
  // If deployed on same domain as client, use relative URL
  return origin;
};

export const API_BASE_URL = getApiEndpoint();

/**
 * Get the full API endpoint for a specific path
 * @param {string} path - API path (e.g., '/api/assistant')
 * @returns {string} - Full API URL
 */
export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};

export default {
  API_BASE_URL,
  getApiUrl,
  isDevelopment
};
