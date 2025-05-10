import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// This function will refresh access tokens for different social providers
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { provider, accountId } = await req.json()

    if (!provider || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get social account
    const { data: socialAccount, error: socialAccountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('provider', provider)
      .single()

    if (socialAccountError || !socialAccount) {
      return new Response(
        JSON.stringify({ error: 'Social account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ensure the user owns this social account
    if (socialAccount.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to refresh this token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if refresh is needed (tokens expiring in less than 1 hour)
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1)
    const expiresAt = new Date(socialAccount.expires_at)
    const needsRefresh = expiresAt < oneHourFromNow

    if (!needsRefresh) {
      return new Response(
        JSON.stringify({ message: 'Token does not need refreshing yet', data: { expiresAt } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Refresh token based on provider
    let newToken
    let newExpiry
    let refreshError

    switch (provider) {
      case 'facebook':
      case 'instagram':
        // Facebook/Instagram token refresh logic
        const fbResponse = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get('FACEBOOK_APP_ID')}&client_secret=${Deno.env.get('FACEBOOK_APP_SECRET')}&fb_exchange_token=${socialAccount.refresh_token}`,
          { method: 'GET' }
        )
        const fbData = await fbResponse.json()
        
        if (fbData.access_token) {
          newToken = fbData.access_token
          // Facebook long-lived tokens typically last 60 days
          newExpiry = new Date()
          newExpiry.setDate(newExpiry.getDate() + 60)
        } else {
          refreshError = fbData.error || 'Failed to refresh Facebook token'
        }
        break

      case 'twitter':
        // Twitter OAuth 2.0 refresh token logic
        const twitterResponse = await fetch(
          'https://api.twitter.com/2/oauth2/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${Deno.env.get('TWITTER_CLIENT_ID')}:${Deno.env.get('TWITTER_CLIENT_SECRET')}`)}`
            },
            body: new URLSearchParams({
              'grant_type': 'refresh_token',
              'refresh_token': socialAccount.refresh_token
            })
          }
        )
        const twitterData = await twitterResponse.json()
        
        if (twitterData.access_token) {
          newToken = twitterData.access_token
          // Also save the new refresh token
          socialAccount.refresh_token = twitterData.refresh_token
          newExpiry = new Date()
          newExpiry.setSeconds(newExpiry.getSeconds() + twitterData.expires_in)
        } else {
          refreshError = twitterData.error || 'Failed to refresh Twitter token'
        }
        break

      case 'linkedin':
        // LinkedIn refresh token logic
        const linkedinResponse = await fetch(
          'https://www.linkedin.com/oauth/v2/accessToken',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              'grant_type': 'refresh_token',
              'refresh_token': socialAccount.refresh_token,
              'client_id': Deno.env.get('LINKEDIN_CLIENT_ID') || '',
              'client_secret': Deno.env.get('LINKEDIN_CLIENT_SECRET') || ''
            })
          }
        )
        const linkedinData = await linkedinResponse.json()
        
        if (linkedinData.access_token) {
          newToken = linkedinData.access_token
          socialAccount.refresh_token = linkedinData.refresh_token || socialAccount.refresh_token
          newExpiry = new Date()
          newExpiry.setSeconds(newExpiry.getSeconds() + linkedinData.expires_in)
        } else {
          refreshError = linkedinData.error || 'Failed to refresh LinkedIn token'
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: `Provider ${provider} refresh not implemented` }),
          { status: 501, headers: { 'Content-Type': 'application/json' } }
        )
    }

    if (refreshError) {
      return new Response(
        JSON.stringify({ error: refreshError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update the social account with the new token
    const { data: updatedAccount, error: updateError } = await supabase
      .from('social_accounts')
      .update({
        access_token: newToken,
        refresh_token: socialAccount.refresh_token,
        expires_at: newExpiry.toISOString()
      })
      .eq('id', accountId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating token:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update token in database' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Token refreshed successfully',
        data: {
          expiresAt: newExpiry,
          provider
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 