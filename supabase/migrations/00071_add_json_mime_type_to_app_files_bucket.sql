-- Add application/json to allowed MIME types for metadata files
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'application/vnd.android.package-archive',  -- APK
    'application/x-msdownload',                  -- EXE
    'application/x-msdos-program',               -- EXE alternative
    'application/x-exe',                         -- EXE alternative
    'application/exe',                           -- EXE alternative
    'application/x-winexe',                      -- EXE alternative
    'application/octet-stream',                  -- Generic binary
    'application/json'                           -- Metadata files
  ]
WHERE id = 'app-files';