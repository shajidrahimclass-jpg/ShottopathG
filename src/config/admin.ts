// Admin panel configuration
// This will be dynamically loaded from app_settings
let ADMIN_BASE_PATH_VALUE = '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef';

// Getter function to access the current admin base path
export const getAdminBasePath = () => ADMIN_BASE_PATH_VALUE;

// Setter function to update the admin base path (used when loading from database)
export const setAdminBasePath = (path: string) => {
  ADMIN_BASE_PATH_VALUE = path;
};

// For backward compatibility
export const ADMIN_BASE_PATH = ADMIN_BASE_PATH_VALUE;

// Helper function to generate admin paths
export const adminPath = (subPath: string = '') => {
  const basePath = getAdminBasePath();
  return subPath ? `${basePath}/${subPath}` : basePath;
};
