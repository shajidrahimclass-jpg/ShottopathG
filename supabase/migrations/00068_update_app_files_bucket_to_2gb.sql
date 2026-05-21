-- Update app-files bucket configuration to allow 2GB file uploads
UPDATE storage.buckets
SET file_size_limit = 2147483648  -- 2GB in bytes (2 * 1024 * 1024 * 1024)
WHERE id = 'app-files';