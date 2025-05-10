-- Enable Row Level Security for all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
-- Everyone can view active subscription plans
CREATE POLICY "View active subscription plans" 
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify subscription plans
CREATE POLICY "Admins can manage subscription plans" 
  ON public.subscription_plans
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Create policies for users
-- Users can view their own data
CREATE POLICY "Users can view own data" 
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own data" 
  ON public.users
  FOR UPDATE
  USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users" 
  ON public.users
  FOR SELECT
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" 
  ON public.users
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Create policies for social_accounts
-- Users can view their own social accounts
CREATE POLICY "Users can view own social accounts" 
  ON public.social_accounts
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can manage their own social accounts
CREATE POLICY "Users can manage own social accounts" 
  ON public.social_accounts
  USING (user_id = auth.uid());

-- Admins can view all social accounts
CREATE POLICY "Admins can view all social accounts" 
  ON public.social_accounts
  FOR SELECT
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Create policies for posts
-- Users can view their own posts
CREATE POLICY "Users can view own posts" 
  ON public.posts
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can manage their own posts
CREATE POLICY "Users can manage own posts" 
  ON public.posts
  USING (user_id = auth.uid());

-- Team members can view posts
CREATE POLICY "Team members can view posts" 
  ON public.posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.user_id = auth.uid()
    )
  );

-- Admins can view all posts
CREATE POLICY "Admins can view all posts" 
  ON public.posts
  FOR SELECT
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Create policies for team_members
-- Users can view teams they are part of
CREATE POLICY "Users can view their teams" 
  ON public.team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage team members
CREATE POLICY "Admins can manage team members" 
  ON public.team_members
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Team owners can manage team members
CREATE POLICY "Team owners can manage team members" 
  ON public.team_members
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
    )
  );

-- Create policies for team_invitations
-- Invitees can view their invitations (by email)
CREATE POLICY "Users can view their invitations" 
  ON public.team_invitations
  FOR SELECT
  USING (email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Team owners and admins can manage invitations
CREATE POLICY "Team owners and admins can manage invitations" 
  ON public.team_invitations
  USING (
    invited_by = auth.uid() 
    OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Create policies for post_analytics
-- Users can view analytics for their own posts
CREATE POLICY "Users can view their post analytics" 
  ON public.post_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_analytics.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics" 
  ON public.post_analytics
  FOR SELECT
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Only system can insert analytics
CREATE POLICY "Only system can insert analytics" 
  ON public.post_analytics
  FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  ); 