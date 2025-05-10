import { useQuery } from '@tanstack/react-query';
import { SocialAccount } from '@shared/schema';

export const useSocialAccounts = () => {
  return useQuery<SocialAccount[]>({
    queryKey: ['/api/social-accounts'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });
};