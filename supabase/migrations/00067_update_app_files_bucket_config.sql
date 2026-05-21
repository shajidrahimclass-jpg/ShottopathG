-- Update app-files bucket configuration to allow APK and EXE files
UPDATE storage.buckets
SET 
  file_size_limit = 734003200,  -- 700MB in bytes
  allowed_mime_types = ARRAY[
    'application/vnd.android.package-archive',  -- APK
    'application/x-msdownload',                  -- EXE
    'application/x-msdos-program',               -- EXE alternative
    'application/x-exe',                         -- EXE alternative
    'application/exe',                           -- EXE alternative
    'application/x-winexe',                      -- EXE alternative
    'application/octet-stream'                   -- Generic binary
  ]
WHERE id = 'app-files';