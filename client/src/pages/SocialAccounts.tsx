import React, { useState } from 'react';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin';

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const platformInfo: Record<SocialPlatform, PlatformInfo> = {
  twitter: { name: 'Twitter', icon: <FaTwitter size={24} />, color: 'bg-blue-400' },
  facebook: { name: 'Facebook', icon: <FaFacebook size={24} />, color: 'bg-blue-600' },
  instagram: { name: 'Instagram', icon: <FaInstagram size={24} />, color: 'bg-pink-500' },
  linkedin: { name: 'LinkedIn', icon: <FaLinkedin size={24} />, color: 'bg-blue-700' }
};

export function SocialAccounts() {
  const { data: socialAccounts, isLoading, error } = useSocialAccounts();
  const [removeLoading, setRemoveLoading] = useState<{[key: string]: boolean}>({});

  const handleConnect = (platform: string) => {
    // Redirect to the appropriate OAuth flow
    window.location.href = `/api/${platform.toLowerCase()}/auth`;
  };

  const handleRemove = async (accountId: number, platform: string) => {
    try {
      setRemoveLoading(prev => ({ ...prev, [accountId]: true }));
      
      const response = await fetch(`/api/social-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to disconnect ${platform}`);
      }
      
      // Force a refresh of social accounts data
      window.location.reload();
    } catch (err) {
      console.error(`Error disconnecting ${platform}:`, err);
      alert(`Failed to disconnect ${platform}. Please try again.`);
    } finally {
      setRemoveLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Failed to load social accounts</div>
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
      <h1 className="text-3xl font-bold mb-8">Connected Social Accounts</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Connected accounts */}
        {socialAccounts?.length > 0 ? (
          socialAccounts.map((account) => {
            const platform = account.platform.toLowerCase() as SocialPlatform;
            const info = platformInfo[platform] || {
              name: account.platform,
              icon: null,
              color: 'bg-gray-500'
            };
            
            return (
              <div key={account.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${info.color} p-3 rounded-full text-white mr-4`}>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{info.name}</h3>
                      <p className="text-gray-600 text-sm">{account.accountName || account.username || 'Connected'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(account.id, account.platform)}
                    disabled={removeLoading[account.id]}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    {removeLoading[account.id] ? 'Removing...' : 'Disconnect'}
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Connected on {new Date(account.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">You don't have any connected social accounts yet.</p>
            <p className="text-gray-500 mb-8">Connect your social media accounts to start posting.</p>
          </div>
        )}
      </div>
      
      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-bold mb-6">Connect New Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(platformInfo).map(([platform, info]) => {
            const isConnected = socialAccounts?.some(
              account => account.platform.toLowerCase() === platform
            );
            
            return (
              <button
                key={platform}
                onClick={() => handleConnect(platform)}
                disabled={isConnected}
                className={`p-4 rounded-lg border ${
                  isConnected 
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                } transition-colors flex flex-col items-center justify-center`}
              >
                <div className={`${isConnected ? 'text-gray-400' : info.color.replace('bg-', 'text-')} mb-2`}>
                  {info.icon}
                </div>
                <span className={`${isConnected ? 'text-gray-400' : 'text-gray-800'} font-medium`}>
                  {info.name}
                </span>
                <span className="text-xs mt-1 text-gray-500">
                  {isConnected ? 'Connected' : 'Connect'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 