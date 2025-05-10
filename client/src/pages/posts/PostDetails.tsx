import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase-client';

interface PostDetailsProps {
  id: number;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  platforms: string[] | null;
  status: string;
  scheduled_for?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  metrics?: any; // Using any to accommodate supabase JSON type
}

export function PostDetails({ id }: PostDetailsProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id.toString())
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Post not found');
        }
        
        setPost(data as Post);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [user, id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    if (!post || !user) {
      setError('Cannot delete: post or user not found');
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Redirect to dashboard after successful deletion
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
      setDeleteLoading(false);
    }
  };

  const getPlatformName = (platformId: string) => {
    const platformMap: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest',
      tiktok: 'TikTok'
    };
    
    return platformMap[platformId.toLowerCase()] || platformId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, label: string }> = {
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };
    
    const config = statusConfig[status.toLowerCase()] || 
      { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <a href="/dashboard" className="text-blue-500 hover:underline">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {post && (
        <>
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold">Post Details</h1>
            
            <div className="flex gap-3">
              <a
                href={`/posts/${id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </a>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${
                  deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 mb-6 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  {getStatusBadge(post.status)}
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {post.platforms && post.platforms.map(platform => (
                    <span 
                      key={platform}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {getPlatformName(platform)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4 whitespace-pre-wrap">
                {post.content}
              </div>
              
              {post.image_url && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <img 
                    src={post.image_url}
                    alt="Post image"
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/image-placeholder.png';
                    }}
                  />
                </div>
              )}
              
              {post.scheduled_for && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Scheduled for:</span>{' '}
                    {new Date(post.scheduled_for).toLocaleString()}
                  </p>
                </div>
              )}
              
              {post.published_at && (
                <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Published at:</span>{' '}
                    {new Date(post.published_at).toLocaleString()}
                  </p>
                </div>
              )}
              
              {post.metrics && typeof post.metrics === 'object' && Object.keys(post.metrics).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(post.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500 uppercase">{key}</div>
                        <div className="text-xl font-semibold">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 