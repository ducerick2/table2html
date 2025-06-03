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
    const response = await fetch(`${API_BASE_URL}/files?page=${page}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching files:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get file details by ID
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getFileDetails = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}?page_size=50`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching file details:', error);
    return { success: false, error: error.message };
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
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/base64image`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching base64 image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get parsed text content
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getParsedText = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/parsed-txt`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching parsed text:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get annotations for a file
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const getAnnotations = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/annotations`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return { success: false, error: error.message };
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
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ annotations }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving annotations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export text
 * @param {string} fileId - The ID of the file
 * @param {string} textContent - The text content to export
 * @returns {Promise} - Promise with the API response
 */
export const exportText = async (fileId, textContent) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/export-txt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: textContent }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error exporting text:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update the parsed text file
 * @param {string} fileId - The ID of the file
 * @param {string} content - The updated text content
 * @returns {Promise} - Promise with the API response
 */
export const updateParsedText = async (fileId, content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/update-parsed-txt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating text:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exclude a file by moving it and its text to the excluded directory
 * @param {string} fileId - The ID of the file
 * @returns {Promise} - Promise with the API response
 */
export const excludeFile = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/exclude`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    console.error('Error excluding file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download all annotations export
 * This opens a download in the browser
 */
export const downloadAllAnnotations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/export-all-annotations`);
    return await response.json();
  } catch (error) {
    console.error('Error downloading all annotations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get server status
 * @returns {Promise} - Promise with the API response
 */
export const getServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    return await response.json();
  } catch (error) {
    console.error('Error getting server status:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getTableFiles,
  getFileDetails,
  getImageUrl,
  getImageBase64,
  getParsedText,
  getAnnotations,
  saveAnnotations,
  exportText,
  updateParsedText,
  excludeFile,
  downloadAllAnnotations,
  getServerStatus
}; 