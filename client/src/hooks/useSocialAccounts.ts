import { useQuery } from '@tanstack/react-query';
import type { SocialAccount } from '../types/social-accounts';

export const useSocialAccounts = () => {
  return useQuery<SocialAccount[]>({
    queryKey: ['/api/social-accounts'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });
};