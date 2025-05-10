import { supabase } from './supabase-client';
import type { Database } from '../../../server/types/supabase';

// Type definitions for better type safety
type UserRow = Database['public']['Tables']['users']['Row'];
type SocialAccountRow = Database['public']['Tables']['social_accounts']['Row'];
type PostRow = Database['public']['Tables']['posts']['Row'];
type Tables = keyof Database['public']['Tables'];

// Generic query function
async function query<T = any>(
  table: Tables, 
  queryFn?: (query: any) => any
): Promise<T[]> {
  let queryBuilder = supabase.from(table).select();
  
  if (queryFn) {
    queryBuilder = queryFn(queryBuilder);
  }
  
  const { data, error } = await queryBuilder;
  
  if (error) {
    console.error(`Error querying ${table}:`, error);
    throw error;
  }
  
  return data || [];
}

// User related functions
export async function fetchCurrentUser(): Promise<UserRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const users = await query<UserRow>('users', (query) => 
    query.eq('email', user.email).single()
  );
  
  return users[0] || null;
}

export async function updateUserProfile(userId: number, userData: Partial<UserRow>): Promise<UserRow> {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  
  return data;
}

// Social accounts functions
export async function fetchUserSocialAccounts(userId: number): Promise<SocialAccountRow[]> {
  return await query<SocialAccountRow>('social_accounts', (query) => 
    query.eq('user_id', userId)
  );
}

export async function connectSocialAccount(accountData: Omit<SocialAccountRow, 'id' | 'created_at'>): Promise<SocialAccountRow> {
  const { data, error } = await supabase
    .from('social_accounts')
    .insert(accountData)
    .select()
    .single();
  
  if (error) {
    console.error('Error connecting social account:', error);
    throw error;
  }
  
  return data;
}

export async function disconnectSocialAccount(accountId: number): Promise<void> {
  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', accountId);
  
  if (error) {
    console.error('Error disconnecting social account:', error);
    throw error;
  }
}

// Posts functions
export async function fetchUserPosts(userId: number, limit?: number): Promise<PostRow[]> {
  return await query<PostRow>('posts', (query) => {
    let q = query.eq('user_id', userId).order('created_at', { ascending: false });
    
    if (limit) {
      q = q.limit(limit);
    }
    
    return q;
  });
}

export async function fetchPostById(postId: number): Promise<PostRow | null> {
  const { data, error } = await supabase
    .from('posts')
    .select()
    .eq('id', postId)
    .single();
  
  if (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
  
  return data;
}

export async function createPost(postData: Omit<PostRow, 'id' | 'created_at'>): Promise<PostRow> {
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }
  
  return data;
}

export async function updatePost(postId: number, postData: Partial<PostRow>): Promise<PostRow> {
  const { data, error } = await supabase
    .from('posts')
    .update(postData)
    .eq('id', postId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating post:', error);
    throw error;
  }
  
  return data;
}

export async function deletePost(postId: number): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Storage functions 
export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Realtime subscription for posts
export function subscribeToUserPosts(userId: number, callback: (payload: any) => void) {
  return supabase
    .channel('posts_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
} 