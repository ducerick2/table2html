import axios from 'axios';

// Set the base URL for API calls
const API_BASE_URL = 'http://localhost:5000/api';

// Create a configured instance of axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get paginated list of table files
 * @param {number} page - Page number
 * @param {number} limit - Number of items per page
 * @returns {Promise} - Promise with the API response
 */
export const getTableFiles = async (page = 1, limit = 50) => {
  try {
    const response = await apiClient.get(`/files?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching table files:', error);
    throw error;
  }
};

/**
 * Get file details by ID
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getFileDetails = async (fileId) => {
  try {
    const response = await apiClient.get(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching file details:', error);
    throw error;
  }
};

/**
 * Get image URL for a file
 * @param {string} fileId - The ID of the file
 * @returns {string} - The URL to the image
 */
export const getImageUrl = (fileId) => {
  return `${API_BASE_URL}/files/${fileId}/image`;
};

/**
 * Get image as base64 data URL
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getImageBase64 = async (fileId) => {
  try {
    const response = await apiClient.get(`/files/${fileId}/base64image`);
    return response.data;
  } catch (error) {
    console.error('Error fetching base64 image:', error);
    throw error;
  }
};

/**
 * Get HTML content for a file
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getHtmlContent = async (fileId) => {
  try {
    const response = await apiClient.get(`/files/${fileId}/html`);
    return response.data;
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    throw error;
  }
};

/**
 * Get annotations for a file
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getAnnotations = async (fileId) => {
  try {
    const response = await apiClient.get(`/files/${fileId}/annotations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }
};

/**
 * Save annotations for a file
 * @param {string} fileId - The ID of the file
 * @param {Object} annotations - The annotations data
 * @returns {Promise} - Promise with the API response
 */
export const saveAnnotations = async (fileId, annotations) => {
  try {
    const response = await apiClient.post(`/files/${fileId}/annotations`, annotations);
    return response.data;
  } catch (error) {
    console.error('Error saving annotations:', error);
    throw error;
  }
};

/**
 * Export corrected HTML
 * @param {string} fileId - The ID of the file
 * @param {string} html - The corrected HTML content
 * @returns {Promise} - Promise with the API response
 */
export const exportHtml = async (fileId, html) => {
  try {
    const response = await apiClient.post(`/files/${fileId}/export-html`, { html });
    return response.data;
  } catch (error) {
    console.error('Error exporting HTML:', error);
    throw error;
  }
};

/**
 * Update the original HTML file
 * @param {string} fileId - The ID of the file
 * @param {string} html - The corrected HTML content
 * @returns {Promise} - Promise with the API response
 */
export const updateHtml = async (fileId, html) => {
  try {
    const response = await apiClient.post(`/files/${fileId}/update-html`, { html });
    return response.data;
  } catch (error) {
    console.error('Error updating HTML file:', error);
    // Return a standardized error response
    return {
      success: false,
      error: error.message || 'Unknown error updating HTML'
    };
  }
};

/**
 * Download all annotations export
 * This opens a download in the browser
 */
export const downloadAllAnnotations = () => {
  window.open(`${API_BASE_URL}/export-all-annotations`, '_blank');
};

/**
 * Get server status
 * @returns {Promise} - Promise with the API response
 */
export const getServerStatus = async () => {
  try {
    const response = await apiClient.get('/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching server status:', error);
    throw error;
  }
};

export default {
  getTableFiles,
  getFileDetails,
  getImageUrl,
  getImageBase64,
  getHtmlContent,
  getAnnotations,
  saveAnnotations,
  exportHtml,
  updateHtml,
  downloadAllAnnotations,
  getServerStatus
}; 