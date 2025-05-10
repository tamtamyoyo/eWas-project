-- Sample seed data for eWas.com platform

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, description, price, features, duration_days, is_active)
VALUES 
  ('Free', 'Basic features for casual users', 0, ARRAY['Up to 10 posts per month', 'Basic analytics', 'Standard support'], 0, true),
  ('Pro', 'Enhanced features for growing influencers', 15.99, ARRAY['Unlimited posts', 'Advanced analytics', 'Priority support', 'Scheduled posting'], 30, true),
  ('Business', 'Complete solution for businesses', 49.99, ARRAY['Unlimited posts', 'Team accounts', 'API access', 'Advanced analytics', 'Priority support', 'Custom branding'], 30, true);

-- Insert sample users (passwords are hashed in a real scenario)
INSERT INTO public.users (email, username, full_name, avatar_url, is_admin, is_verified)
VALUES 
  ('admin@ewas.com', 'admin', 'Administrator', 'https://ui-avatars.com/api/?name=Administrator', true, true),
  ('demo@ewas.com', 'demouser', 'Demo User', 'https://ui-avatars.com/api/?name=Demo+User', false, true),
  ('test@ewas.com', 'testuser', 'Test User', 'https://ui-avatars.com/api/?name=Test+User', false, true);

-- Associate users with subscription plans
UPDATE public.users SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Free') 
WHERE username = 'demouser';

UPDATE public.users SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Pro')
WHERE username = 'testuser';

UPDATE public.users SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'Business')
WHERE username = 'admin';

-- Insert sample social accounts
INSERT INTO public.social_accounts (user_id, provider, provider_user_id, access_token, refresh_token, expires_at, username, profile_url)
VALUES 
  ((SELECT id FROM public.users WHERE username = 'demouser'), 'twitter', 'twitter123', 'dummy_token', 'dummy_refresh', CURRENT_TIMESTAMP + INTERVAL '30 days', 'demouser_twitter', 'https://twitter.com/demouser'),
  ((SELECT id FROM public.users WHERE username = 'demouser'), 'facebook', 'facebook123', 'dummy_token', 'dummy_refresh', CURRENT_TIMESTAMP + INTERVAL '60 days', 'demouser_fb', 'https://facebook.com/demouser'),
  ((SELECT id FROM public.users WHERE username = 'testuser'), 'instagram', 'instagram123', 'dummy_token', 'dummy_refresh', CURRENT_TIMESTAMP + INTERVAL '45 days', 'testuser_ig', 'https://instagram.com/testuser');

-- Insert sample posts
INSERT INTO public.posts (user_id, content, image_url, scheduled_for, status, platforms)
VALUES 
  ((SELECT id FROM public.users WHERE username = 'demouser'), 'Hello world from eWas.com! #firstpost', NULL, NULL, 'published', ARRAY['twitter', 'facebook']),
  ((SELECT id FROM public.users WHERE username = 'testuser'), 'Testing the scheduling feature on eWas platform', 'https://picsum.photos/600/400', CURRENT_TIMESTAMP + INTERVAL '1 day', 'scheduled', ARRAY['instagram']),
  ((SELECT id FROM public.users WHERE username = 'demouser'), 'Check out this amazing content! #social #media', 'https://picsum.photos/600/400', NULL, 'published', ARRAY['twitter', 'facebook', 'instagram']),
  ((SELECT id FROM public.users WHERE username = 'admin'), 'Welcome to eWas.com - The best social media management platform!', NULL, NULL, 'published', ARRAY['twitter', 'facebook', 'linkedin']);

-- Insert sample team
INSERT INTO public.team_members (user_id, role, permissions)
VALUES 
  ((SELECT id FROM public.users WHERE username = 'admin'), 'owner', ARRAY['create', 'read', 'update', 'delete', 'invite']),
  ((SELECT id FROM public.users WHERE username = 'testuser'), 'editor', ARRAY['create', 'read', 'update']);

-- Insert sample team invitation
INSERT INTO public.team_invitations (email, role, invited_by, expires_at, token)
VALUES 
  ('invited@example.com', 'viewer', (SELECT id FROM public.users WHERE username = 'admin'), CURRENT_TIMESTAMP + INTERVAL '7 days', 'sample_invitation_token'); 