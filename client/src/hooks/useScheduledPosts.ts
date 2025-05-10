import { useQuery } from '@tanstack/react-query';
import { Post } from '@shared/schema';

export const useScheduledPosts = () => {
  return useQuery<Post[]>({
    queryKey: ['/api/posts/scheduled'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });
};