export interface SocialAccount {
  id: number;
  userId: number;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  tokenSecret?: string;
  expiresAt?: string;
  accountId?: string;
  username?: string;
  accountName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
} 