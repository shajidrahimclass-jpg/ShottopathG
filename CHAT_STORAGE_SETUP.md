# Chat Images Storage Setup

## Storage Bucket Configuration

A storage bucket named `chat-images` needs to be created in Supabase for storing chat image uploads.

### Steps to Create Storage Bucket:

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Bucket name: `chat-images`
4. Public bucket: **Yes** (enable public access)
5. Click "Create bucket"

### Storage Policies:

After creating the bucket, add these policies:

#### Allow authenticated users to upload images:
```sql
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');
```

#### Allow public read access:
```sql
CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
```

#### Allow users to delete their own images:
```sql
CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images');
```

### File Upload Limits:
- Maximum file size: 1MB
- Allowed formats: JPG, JPEG, PNG, GIF, WEBP
- Files are stored in `chat_images/` folder with naming pattern: `{orderId}_{timestamp}.{ext}`

### Usage in Application:
The `uploadChatImage` function in `api.ts` handles:
- File validation
- Unique filename generation
- Upload to storage bucket
- Public URL retrieval
