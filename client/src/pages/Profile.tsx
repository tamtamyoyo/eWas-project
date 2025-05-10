import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  photo_url?: string;
  created_at: string;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // In a real implementation, you might fetch additional profile data from your API
        // const response = await fetch('/api/profile');
        // const data = await response.json();
        
        // For now, we'll just use the user data from auth context
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username,
            full_name: user.user_metadata?.full_name,
            photo_url: user.user_metadata?.photo_url,
            created_at: user.created_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      {profile ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              {profile.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.full_name || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                  <span className="text-4xl font-bold">
                    {profile.full_name ? profile.full_name[0].toUpperCase() : 
                     profile.username ? profile.username[0].toUpperCase() : 
                     profile.email[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{profile.full_name || profile.username || 'User'}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <p className="text-sm text-gray-500 mt-1">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Account Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Username:</span> {profile.username || 'Not set'}</p>
                    <p><span className="font-medium">Email:</span> {profile.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8">
          <p>No profile data available.</p>
        </div>
      )}
    </div>
  );
} 