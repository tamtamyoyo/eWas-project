import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase-client';

export function CreatePost() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    if (!user) return;
    
    if (formData.content.trim() === '') {
      setError('Content cannot be empty');
      return;
    }
    
    if (formData.platforms.length === 0) {
      setError('At least one platform must be selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Prepare data for creation
      const postData: any = {
        user_id: user.id,
        content: formData.content,
        platforms: formData.platforms,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (formData.image_url.trim() !== '') {
        postData.image_url = formData.image_url;
      }
      
      if (formData.scheduled_for.trim() !== '') {
        postData.scheduled_for = new Date(formData.scheduled_for).toISOString();
        postData.status = 'scheduled';
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select();
      
      if (error) throw error;
      
      // Clear form and show success
      setFormData({
        content: '',
        image_url: '',
        platforms: [],
        scheduled_for: ''
      });
      setSuccess(true);

      // If post was created, redirect to view it
      if (data && data.length > 0) {
        setTimeout(() => {
          window.location.href = `/posts/${data[0].id}`;
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-6 bg-green-100 text-green-800 rounded">
          Post created successfully! Redirecting...
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
            placeholder="What would you like to share?"
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
            placeholder="https://example.com/image.jpg"
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
          <p className="text-sm text-gray-500 mt-1">
            Leave empty to save as draft
          </p>
        </div>
        
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded bg-blue-500 text-white ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
          
          <a
            href="/dashboard"
            className="px-6 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
} 