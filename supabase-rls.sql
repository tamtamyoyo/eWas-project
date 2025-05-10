
-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own user data" ON users
  FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own user data" ON users
  FOR UPDATE USING (auth.uid() = id::text);

-- Create policies for social_accounts table
CREATE POLICY "Users can view their own social accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert their own social accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own social accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own social accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id::text);

-- Create policies for posts table
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id::text);

-- Create policies for subscription_plans table
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Create policies for team_members table
CREATE POLICY "Team owners can view their team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Users can view teams they belong to" ON team_members
  FOR SELECT USING (
    user_id::text = auth.uid()
  );

CREATE POLICY "Team owners can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Team owners can update team members" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Team owners can delete team members" ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

-- Create policies for team_invitations table
CREATE POLICY "Team owners can view their team invitations" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON team_invitations
  FOR SELECT USING (
    email = (
      SELECT email FROM users
      WHERE users.id::text = auth.uid()
    )
  );

CREATE POLICY "Team owners can insert team invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  );

CREATE POLICY "Team owners can delete team invitations" ON team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  );
