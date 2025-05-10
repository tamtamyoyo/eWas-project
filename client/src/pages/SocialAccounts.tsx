import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase-client';

// Define types for social accounts
interface SocialAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
  profile_data?: any;
  status: string;
}

// Define the database returned type
interface DbSocialAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string; // Different from our internal type
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null; // Different from our internal type
  username: string | null;
  profile_url: string | null;
  created_at: string;
  updated_at: string;
}

export function SocialAccounts() {
  const { user } = useAuth();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch connected social accounts when component mounts
    const fetchSocialAccounts = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Convert database type to component type
        const formattedAccounts: SocialAccount[] = (data as DbSocialAccount[]).map(account => ({
          id: account.id,
          user_id: account.user_id,
          provider: account.provider,
          provider_id: account.provider_user_id,
          access_token: account.access_token || '',
          refresh_token: account.refresh_token || undefined,
          token_expires_at: account.expires_at || undefined,
          created_at: account.created_at,
          updated_at: account.updated_at,
          profile_data: {
            username: account.username,
            profile_url: account.profile_url
          },
          status: 'active' // Default status if not available in DB
        }));
        
        setSocialAccounts(formattedAccounts);
      } catch (err: any) {
        console.error('Error fetching social accounts:', err);
        setError(err.message || 'Failed to load social accounts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSocialAccounts();
  }, [user]);

  const disconnectAccount = async (accountId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update state after successful disconnect
      setSocialAccounts((prev) => prev ? prev.filter(account => account.id !== accountId) : null);
    } catch (err: any) {
      console.error('Error disconnecting account:', err);
      setError(err.message || 'Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    const iconMap: Record<string, string> = {
      facebook: '/images/facebook.svg',
      twitter: '/images/twitter.svg',
      instagram: '/images/instagram.svg',
      linkedin: '/images/linkedin.svg',
      google: '/images/google.svg',
      tiktok: '/images/tiktok.svg',
      snapchat: '/images/snapchat.svg',
      pinterest: '/images/pinterest.svg',
      youtube: '/images/youtube.svg',
    };
    
    return iconMap[provider.toLowerCase()] || '/images/default-social.svg';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Connected Social Accounts</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && socialAccounts && socialAccounts.length === 0 && (
        <div className="p-6 text-center bg-gray-50 rounded-lg shadow-sm">
          <p className="text-gray-600 mb-4">You don't have any social accounts connected yet.</p>
          <a 
            href="/connect" 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Connect Accounts
          </a>
        </div>
      )}
      
      {!loading && socialAccounts && socialAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialAccounts.map(account => (
            <div key={account.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <img 
                    src={getProviderIcon(account.provider)} 
                    alt={account.provider} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium capitalize">{account.provider}</h3>
                  <p className="text-sm text-gray-500">
                    Connected on {new Date(account.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${account.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {account.status || 'unknown'}
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => disconnectAccount(account.id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                  disabled={loading}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Add More Accounts</h2>
        <p className="mb-4 text-gray-600">Connect additional social media accounts to post across more platforms.</p>
        <a 
          href="/connect" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect More Accounts
        </a>
      </div>
    </div>
  );
} 