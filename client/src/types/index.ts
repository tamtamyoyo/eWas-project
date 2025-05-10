import { SocialAccount as DbSocialAccount, Post as DbPost } from '@shared/schema';

// Re-export the types from schema
export type SocialAccount = DbSocialAccount;
export type Post = DbPost;

// Add custom frontend-specific types here as needed
export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  size?: number;
  name?: string;
}