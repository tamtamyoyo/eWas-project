import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

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
          username
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      
    if (queryError) {
      console.error('Error fetching scheduled posts:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled posts' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to process' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${scheduledPosts.length} scheduled posts`)
    
    // Process each post
    const results = await Promise.all(
      scheduledPosts.map(async (post) => {
        try {
          const platforms = post.platforms || []
          
          // For each platform, publish the post
          const platformResults = await Promise.all(
            platforms.map(async (platform) => {
              // Find the social account for this platform
              const socialAccount = post.social_accounts.find(
                account => account.provider === platform
              )
              
              if (!socialAccount) {
                return {
                  platform,
                  success: false,
                  error: `No connected account for ${platform}`
                }
              }
              
              // Check if token needs refreshing
              const expiresAt = new Date(socialAccount.expires_at)
              const now = new Date()
              if (expiresAt < now) {
                // Token expired, should have been refreshed by refresh-tokens function
                // We'll skip this platform for now
                return {
                  platform,
                  success: false,
                  error: `Token expired for ${platform}`
                }
              }
              
              // Post to the platform
              let success = false
              let platformPostId = null
              let error = null
              
              try {
                switch (platform) {
                  case 'twitter':
                    // Post to Twitter
                    const twitterResult = await postToTwitter(
                      socialAccount.access_token,
                      post.content,
                      post.image_url
                    )
                    success = twitterResult.success
                    platformPostId = twitterResult.id
                    error = twitterResult.error
                    break
                    
                  case 'facebook':
                    // Post to Facebook
                    const facebookResult = await postToFacebook(
                      socialAccount.access_token,
                      post.content,
                      post.image_url
                    )
                    success = facebookResult.success
                    platformPostId = facebookResult.id
                    error = facebookResult.error
                    break
                    
                  case 'instagram':
                    // Post to Instagram
                    const instagramResult = await postToInstagram(
                      socialAccount.access_token,
                      post.content,
                      post.image_url
                    )
                    success = instagramResult.success
                    platformPostId = instagramResult.id
                    error = instagramResult.error
                    break
                    
                  case 'linkedin':
                    // Post to LinkedIn
                    const linkedinResult = await postToLinkedIn(
                      socialAccount.access_token,
                      post.content,
                      post.image_url
                    )
                    success = linkedinResult.success
                    platformPostId = linkedinResult.id
                    error = linkedinResult.error
                    break
                    
                  default:
                    error = `Unsupported platform: ${platform}`
                }
              } catch (err) {
                console.error(`Error posting to ${platform}:`, err)
                error = `${err}`
                success = false
              }
              
              return {
                platform,
                success,
                platformPostId,
                error
              }
            })
          )
          
          // Update post status
          const allSucceeded = platformResults.every(result => result.success)
          const anySucceeded = platformResults.some(result => result.success)
          
          // Store metrics from the social media posting
          const metrics = {
            platforms: platformResults.reduce((acc, result) => {
              acc[result.platform] = {
                success: result.success,
                platformPostId: result.platformPostId,
                error: result.error
              }
              return acc
            }, {})
          }
          
          let newStatus = 'draft'
          if (allSucceeded) {
            newStatus = 'published'
          } else if (anySucceeded) {
            newStatus = 'partially_published'
          } else {
            newStatus = 'failed'
          }
          
          const { error: updateError } = await supabase
            .from('posts')
            .update({
              status: newStatus,
              metrics: metrics,
              published_at: anySucceeded ? new Date().toISOString() : null
            })
            .eq('id', post.id)
            
          if (updateError) {
            console.error(`Error updating post ${post.id}:`, updateError)
          }
          
          return {
            postId: post.id,
            status: newStatus,
            platforms: platformResults
          }
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error)
          return {
            postId: post.id,
            status: 'error',
            error: `${error}`
          }
        }
      })
    )
    
    return new Response(
      JSON.stringify({
        message: `Processed ${scheduledPosts.length} posts`,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error processing scheduled posts:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Platform-specific posting functions
async function postToTwitter(accessToken, content, imageUrl) {
  try {
    // Twitter API v2 endpoint for creating tweets
    const endpoint = 'https://api.twitter.com/2/tweets'
    
    let requestBody = {
      text: content
    }
    
    // If there's an image, we need to upload it first
    if (imageUrl) {
      // This is simplified - in reality, you would:
      // 1. Download the image from imageUrl
      // 2. Upload to Twitter's media endpoint
      // 3. Get the media_id
      // 4. Include it in the tweet creation
      console.log('Image attachment would be processed here for Twitter')
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const data = await response.json()
    
    if (response.ok && data.data && data.data.id) {
      return {
        success: true,
        id: data.data.id
      }
    } else {
      return {
        success: false,
        error: data.errors ? JSON.stringify(data.errors) : 'Unknown error'
      }
    }
  } catch (error) {
    console.error('Twitter posting error:', error)
    return {
      success: false,
      error: `${error}`
    }
  }
}

async function postToFacebook(accessToken, content, imageUrl) {
  try {
    // Facebook API endpoint for posting to a user's feed
    const endpoint = 'https://graph.facebook.com/v19.0/me/feed'
    
    const formData = new URLSearchParams()
    formData.append('message', content)
    
    if (imageUrl) {
      formData.append('link', imageUrl)
    }
    
    formData.append('access_token', accessToken)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    if (response.ok && data.id) {
      return {
        success: true,
        id: data.id
      }
    } else {
      return {
        success: false,
        error: data.error ? JSON.stringify(data.error) : 'Unknown error'
      }
    }
  } catch (error) {
    console.error('Facebook posting error:', error)
    return {
      success: false,
      error: `${error}`
    }
  }
}

async function postToInstagram(accessToken, content, imageUrl) {
  try {
    // Instagram requires an image for posting
    if (!imageUrl) {
      return {
        success: false,
        error: 'Instagram posts require an image'
      }
    }
    
    // Instagram API endpoints
    // First, create a container
    const createContainerEndpoint = 'https://graph.facebook.com/v19.0/me/media'
    
    const containerFormData = new URLSearchParams()
    containerFormData.append('caption', content)
    containerFormData.append('image_url', imageUrl)
    containerFormData.append('access_token', accessToken)
    
    const containerResponse = await fetch(createContainerEndpoint, {
      method: 'POST',
      body: containerFormData
    })
    
    const containerData = await containerResponse.json()
    
    if (!containerResponse.ok || !containerData.id) {
      return {
        success: false,
        error: containerData.error ? JSON.stringify(containerData.error) : 'Failed to create media container'
      }
    }
    
    // Second, publish the container
    const publishEndpoint = `https://graph.facebook.com/v19.0/me/media_publish`
    
    const publishFormData = new URLSearchParams()
    publishFormData.append('creation_id', containerData.id)
    publishFormData.append('access_token', accessToken)
    
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      body: publishFormData
    })
    
    const publishData = await publishResponse.json()
    
    if (publishResponse.ok && publishData.id) {
      return {
        success: true,
        id: publishData.id
      }
    } else {
      return {
        success: false,
        error: publishData.error ? JSON.stringify(publishData.error) : 'Failed to publish media'
      }
    }
  } catch (error) {
    console.error('Instagram posting error:', error)
    return {
      success: false,
      error: `${error}`
    }
  }
}

async function postToLinkedIn(accessToken, content, imageUrl) {
  try {
    // LinkedIn API endpoint for posting
    const endpoint = 'https://api.linkedin.com/v2/ugcPosts'
    
    let requestBody = {
      author: 'urn:li:person:{person_id}', // Replace {person_id} with the actual LinkedIn user ID
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }
    
    // If there's an image, update the media category and add media
    if (imageUrl) {
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE'
      requestBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          description: {
            text: 'Image Description'
          },
          media: imageUrl
        }
      ]
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    const data = await response.json()
    
    if (response.ok && data.id) {
      return {
        success: true,
        id: data.id
      }
    } else {
      return {
        success: false,
        error: data.message || 'Unknown error'
      }
    }
  } catch (error) {
    console.error('LinkedIn posting error:', error)
    return {
      success: false,
      error: `${error}`
    }
  }
} 