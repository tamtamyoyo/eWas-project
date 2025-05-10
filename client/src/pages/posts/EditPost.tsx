import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase-client';

interface EditPostProps {
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
}

export function EditPost({ id }: EditPostProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    platforms: [] as string[],
    scheduled_for: ''
  });

  // Available platforms
  const availablePlatforms = [
    { id: 'twitter', name: 'Twitter' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'linkedin', name: 'LinkedIn' }
  ];

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
        
        setPost(data);
        setFormData({
          content: data.content || '',
          image_url: data.image_url || '',
          platforms: data.platforms || [],
          scheduled_for: data.scheduled_for 
            ? new Date(data.scheduled_for).toISOString().slice(0, 16) 
            : ''
        });
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [user, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => {
      const platforms = [...prev.platforms];
      
      if (platforms.includes(platformId)) {
        return {
          ...prev,
          platforms: platforms.filter(p => p !== platformId)
        };
      } else {
        return {
          ...prev,
          platforms: [...platforms, platformId]
        };
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user || !post) return;
    
    if (formData.content.trim() === '') {
      setError('Content cannot be empty');
      return;
    }
    
    if (formData.platforms.length === 0) {
      setError('At least one platform must be selected');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare data for update
      const updateData: any = {
        content: formData.content,
        platforms: formData.platforms,
        updated_at: new Date().toISOString()
      };
      
      if (formData.image_url.trim() !== '') {
        updateData.image_url = formData.image_url;
      }
      
      if (formData.scheduled_for.trim() !== '') {
        updateData.scheduled_for = new Date(formData.scheduled_for).toISOString();
        updateData.status = 'scheduled';
      }
      
      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Redirect to post details page or dashboard
      window.location.href = `/posts/${id}`;
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.image_url && (
            <div className="mt-2 border rounded p-2">
              <img 
                src={formData.image_url} 
                alt="Preview" 
                className="h-40 object-cover mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/image-placeholder.png';
                }}
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platforms
          </label>
          <div className="flex flex-wrap gap-3">
            {availablePlatforms.map(platform => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`px-4 py-2 rounded-full text-sm ${
                  formData.platforms.includes(platform.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {platform.name}
              </button>
            ))}
          </div>
          {formData.platforms.length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              Select at least one platform
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="scheduled_for" className="block text-sm font-medium text-gray-700 mb-1">
            Schedule for (optional)
          </label>
          <input
            type="datetime-local"
            id="scheduled_for"
            name="scheduled_for"
            value={formData.scheduled_for}
            onChange={handleInputChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2 rounded bg-blue-500 text-white ${
              saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <a
            href={`/posts/${id}`}
            className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
} 