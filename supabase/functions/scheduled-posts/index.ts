import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Define types
interface PlatformResult {
  platform: string;
  success: boolean;
  error?: string;
  post_id?: string;
}

interface TokenRefreshResult {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  error?: string;
}

interface PublishResult {
  success: boolean;
  error?: string;
  post_id?: string;
}

interface SocialAccount {
  id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  status: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// This function will process scheduled posts
serve(async (req) => {
  // Accept CRON invocations
  // This is set up to run on a schedule via Supabase scheduled functions

  try {
    // Find posts that are scheduled to be published
    const now = new Date().toISOString()
    
    const { data: scheduledPosts, error: queryError } = await supabase
      .from('posts')
      .select(`
        id, 
        content, 
        image_url, 
        platforms,
        user_id,
        users (
          id,
          email
        ),
        social_accounts (
          id,
          provider,
          access_token,
          refresh_token,
          token_expires_at,
          status
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
    
    if (queryError) throw queryError
    
    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No posts scheduled for publishing'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Process each scheduled post
    const results = await Promise.all(
      scheduledPosts.map(async (post) => {
        try {
          // Get all social accounts for the post user
          const userSocialAccounts = post.social_accounts as SocialAccount[] | null
          
          // Track individual platform publishing results
          const platformResults: PlatformResult[] = []
          
          // Publish to each selected platform
          for (const platform of (post.platforms || [])) {
            // Find the user's account for this platform
            const account = userSocialAccounts?.find(acc => 
              acc.provider.toLowerCase() === platform.toLowerCase()
            )
            
            if (!account) {
              platformResults.push({
                platform,
                success: false,
                error: 'No connected account found'
              })
              continue
            }
            
            // Check if token needs refreshing
            if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
              // Token needs refreshing - call refresh token function
              const refreshResult = await refreshToken(account)
              
              if (refreshResult.error) {
                platformResults.push({
                  platform,
                  success: false,
                  error: `Token refresh failed: ${refreshResult.error}`
                })
                continue
              }
              
              // Update account with new token information
              account.access_token = refreshResult.access_token || account.access_token
            }
            
            // Now publish the post to this platform
            const publishResult = await publishToSocialPlatform(
              platform, 
              account.access_token,
              post.content,
              post.image_url || ''
            )
            
            platformResults.push({
              platform,
              success: publishResult.success,
              error: publishResult.error,
              post_id: publishResult.post_id
            })
          }
          
          // Update post status based on publishing results
          const allSuccessful = platformResults.every(result => result.success)
          const someSuccessful = platformResults.some(result => result.success)
          
          const newStatus = allSuccessful ? 'published' : someSuccessful ? 'partially_published' : 'failed'
          
          // Update the post in the database
          const { error: updateError } = await supabase
            .from('posts')
            .update({ 
              status: newStatus,
              published_at: allSuccessful || someSuccessful ? now : null,
              metrics: platformResults.reduce((acc, result) => {
                if (result.post_id) {
                  acc[`${result.platform}_id`] = result.post_id
                }
                return acc
              }, {} as Record<string, string>)
            })
            .eq('id', post.id)
          
          if (updateError) throw updateError
          
          return {
            post_id: post.id,
            status: newStatus,
            platforms: platformResults
          }
        } catch (err) {
          console.error(`Error publishing post ${post.id}:`, err)
          
          // Update post to failed status
          await supabase
            .from('posts')
            .update({ 
              status: 'failed'
            })
            .eq('id', post.id)
          
          return {
            post_id: post.id,
            status: 'failed',
            error: err.message || 'Unknown error'
          }
        }
      })
    )
    
    return new Response(JSON.stringify({ 
      processed: scheduledPosts.length,
      results
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Error processing scheduled posts:', err)
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Refreshes the access token for a social account
 */
async function refreshToken(account: SocialAccount): Promise<TokenRefreshResult> {
  try {
    // Call the refresh-tokens edge function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        provider: account.provider,
        refresh_token: account.refresh_token
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.access_token) {
      throw new Error('No access token returned')
    }
    
    // Update the token in the database
    await supabase
      .from('social_accounts')
      .update({
        access_token: result.access_token,
        refresh_token: result.refresh_token || account.refresh_token,
        token_expires_at: result.expires_at || null
      })
      .eq('id', account.id)
    
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token || account.refresh_token,
      expires_at: result.expires_at
    }
  } catch (err) {
    console.error('Error refreshing token:', err)
    return { error: err.message || 'Token refresh failed' }
  }
}

/**
 * Publishes a post to a social media platform
 */
async function publishToSocialPlatform(
  platform: string, 
  accessToken: string, 
  content: string,
  mediaUrl: string
): Promise<PublishResult> {
  try {
    // Here we'd implement platform-specific publishing logic
    // This is a simplified example - real implementation would use platform APIs
    switch(platform.toLowerCase()) {
      case 'twitter': 
        return await publishToTwitter(accessToken, content, mediaUrl)
      case 'facebook':
        return await publishToFacebook(accessToken, content, mediaUrl)
      case 'instagram':
        return await publishToInstagram(accessToken, content, mediaUrl)
      case 'linkedin':
        return await publishToLinkedIn(accessToken, content, mediaUrl)
      default:
        return {
          success: false,
          error: `Unsupported platform: ${platform}`
        }
    }
  } catch (err) {
    console.error(`Error publishing to ${platform}:`, err)
    return {
      success: false,
      error: err.message || `Failed to publish to ${platform}`
    }
  }
}

// Platform-specific publishing functions
async function publishToTwitter(accessToken: string, content: string, mediaUrl: string) {
  // Simplified example - would use Twitter API in real implementation
  console.log(`Publishing to Twitter: ${content.substring(0, 20)}...`)
  
  // Simulate success for test purposes
  if (Math.random() > 0.1) { // 90% success rate for testing
    return {
      success: true,
      post_id: `tw_${Date.now()}`
    }
  } else {
    return {
      success: false,
      error: 'Twitter API error (simulated)'
    }
  }
}

async function publishToFacebook(accessToken: string, content: string, mediaUrl: string) {
  // Simplified example - would use Facebook Graph API in real implementation
  console.log(`Publishing to Facebook: ${content.substring(0, 20)}...`)
  
  // Simulate success
  if (Math.random() > 0.1) {
    return {
      success: true,
      post_id: `fb_${Date.now()}`
    }
  } else {
    return {
      success: false,
      error: 'Facebook API error (simulated)'
    }
  }
}

async function publishToInstagram(accessToken: string, content: string, mediaUrl: string) {
  // Simplified example - would use Instagram Graph API in real implementation
  console.log(`Publishing to Instagram: ${content.substring(0, 20)}...`)
  
  // Instagram requires media
  if (!mediaUrl) {
    return {
      success: false,
      error: 'Instagram requires an image or video'
    }
  }
  
  // Simulate success
  if (Math.random() > 0.2) {
    return {
      success: true,
      post_id: `ig_${Date.now()}`
    }
  } else {
    return {
      success: false,
      error: 'Instagram API error (simulated)'
    }
  }
}

async function publishToLinkedIn(accessToken: string, content: string, mediaUrl: string) {
  // Simplified example - would use LinkedIn API in real implementation
  console.log(`Publishing to LinkedIn: ${content.substring(0, 20)}...`)
  
  // Construct LinkedIn share
  const shareContent = {
    shareCommentary: {
      text: content
    },
    shareMediaCategory: 'NONE',
  }
  
  if (mediaUrl) {
    shareContent.shareMediaCategory = 'IMAGE'
    // In a real implementation, we would add media content here
  }
  
  // Simulate success
  if (Math.random() > 0.1) {
    return {
      success: true,
      post_id: `li_${Date.now()}`
    }
  } else {
    return {
      success: false,
      error: 'LinkedIn API error (simulated)'
    }
  }
} 