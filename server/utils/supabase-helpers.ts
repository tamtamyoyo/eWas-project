import supabase, { query } from '../db';
import { Database } from '../types/supabase';

// Type definitions
type Tables = keyof Database['public']['Tables'];
type TableRow<T extends Tables> = Database['public']['Tables'][T]['Row'];

/**
 * Get a user by ID
 * @param userId User ID to find
 * @returns User object or null if not found
 */
export async function getUserById(userId: number): Promise<TableRow<'users'> | null> {
  const users = await query<TableRow<'users'>>('users', (query) => 
    query.eq('id', userId)
  );
  
  return users[0] || null;
}

/**
 * Get a user by email
 * @param email Email to search for
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string): Promise<TableRow<'users'> | null> {
  const users = await query<TableRow<'users'>>('users', (query) => 
    query.eq('email', email)
  );
  
  return users[0] || null;
}

/**
 * Get social accounts for a user
 * @param userId User ID to find accounts for
 * @returns Array of social account objects
 */
export async function getUserSocialAccounts(userId: number): Promise<TableRow<'social_accounts'>[]> {
  return await query<TableRow<'social_accounts'>>('social_accounts', (query) => 
    query.eq('user_id', userId)
  );
}

/**
 * Get a specific social account
 * @param userId User ID
 * @param platform Platform name (e.g., 'twitter', 'facebook')
 * @returns Social account object or null if not found
 */
export async function getSocialAccount(userId: number, platform: string): Promise<TableRow<'social_accounts'> | null> {
  const accounts = await query<TableRow<'social_accounts'>>('social_accounts', (query) => 
    query.eq('user_id', userId).eq('platform', platform)
  );
  
  return accounts[0] || null;
}

/**
 * Create a new user
 * @param userData User data to insert
 * @returns Created user object
 */
export async function createUser(userData: Database['public']['Tables']['users']['Insert']): Promise<TableRow<'users'> | null> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }
  
  return data;
}

/**
 * Update a user
 * @param userId User ID to update
 * @param userData User data to update
 * @returns Updated user object
 */
export async function updateUser(userId: number, userData: Partial<TableRow<'users'>>): Promise<TableRow<'users'> | null> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create a social account
 * @param accountData Social account data to insert
 * @returns Created account object
 */
export async function createSocialAccount(accountData: Omit<TableRow<'social_accounts'>, 'id' | 'created_at'>): Promise<TableRow<'social_accounts'> | null> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
  const { data, error } = await supabase
    .from('social_accounts')
    .insert(accountData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating social account:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get all posts for a user
 * @param userId User ID to find posts for
 * @param limit Optional limit on number of posts to return
 * @returns Array of post objects
 */
export async function getUserPosts(userId: number, limit?: number): Promise<TableRow<'posts'>[]> {
  let queryBuilder = supabase?.from('posts').select().eq('user_id', userId).order('created_at', { ascending: false });
  
  if (limit) {
    queryBuilder = queryBuilder?.limit(limit);
  }
  
  const { data, error } = await queryBuilder || {};
  
  if (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Create a new post
 * @param postData Post data to insert
 * @returns Created post object
 */
export async function createPost(postData: Omit<TableRow<'posts'>, 'id' | 'created_at'>): Promise<TableRow<'posts'> | null> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
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

/**
 * Update a post
 * @param postId Post ID to update
 * @param postData Post data to update
 * @returns Updated post object
 */
export async function updatePost(postId: number, postData: Partial<TableRow<'posts'>>): Promise<TableRow<'posts'> | null> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
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

/**
 * Delete a post
 * @param postId Post ID to delete
 * @returns Success status
 */
export async function deletePost(postId: number): Promise<boolean> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
  
  return true;
}

/**
 * Get scheduled posts that are ready to be published
 * @returns Array of posts to be published
 */
export async function getScheduledPostsToPublish(): Promise<TableRow<'posts'>[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    ?.from('posts')
    .select()
    .eq('status', 'scheduled')
    .lt('scheduled_at', now) || {};
  
  if (error) {
    console.error('Error fetching scheduled posts:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Upsert multiple rows in a table
 * @param table Table name
 * @param rows Array of row data to insert or update
 * @returns Array of inserted/updated rows
 */
export async function upsertMany<T extends Tables>(
  table: T, 
  rows: Partial<TableRow<T>>[]
): Promise<TableRow<T>[]> {
  if (!supabase || rows.length === 0) {
    return [];
  }
  
  const { data, error } = await supabase
    .from(table)
    .upsert(rows)
    .select();
  
  if (error) {
    console.error(`Error upserting to ${table}:`, error);
    throw error;
  }
  
  return data || [];
}

/**
 * Execute a raw SQL query (use with caution)
 * @param sql SQL query to execute
 * @param params Query parameters
 * @returns Query result
 */
export async function executeRawQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query_text: sql,
    query_params: params
  });
  
  if (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }
  
  return data || [];
} 