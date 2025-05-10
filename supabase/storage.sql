-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('post_images', 'post_images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('post_videos', 'post_videos', true, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/mpeg', 'video/x-msvideo']), 
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Create RLS policies for storage buckets
-- Avatars bucket: Users can read any avatar, but only upload/update their own
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Post images bucket: Anyone can view post images, only post owner can upload/modify
CREATE POLICY "Anyone can read post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post_images');

CREATE POLICY "Users can upload their own post images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post_images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post_images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post_images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Post videos bucket: Similar to post images
CREATE POLICY "Anyone can read post videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post_videos');

CREATE POLICY "Users can upload their own post videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post_videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own post videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post_videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post_videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents bucket: Only authenticated users can access their own documents
CREATE POLICY "Users can select their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 