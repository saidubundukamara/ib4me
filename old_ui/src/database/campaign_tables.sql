-- Campaign Management System Database Schema

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  beneficiary TEXT NOT NULL,
  summary TEXT NOT NULL,
  story TEXT NOT NULL,
  cover_image_url TEXT,
  additional_image_urls TEXT[],
  video_url TEXT,
  goal DECIMAL(12,2) NOT NULL,
  deadline DATE NOT NULL,
  privacy TEXT NOT NULL,
  show_donors BOOLEAN NOT NULL DEFAULT TRUE,
  allow_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  terms_agreed BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed, cancelled
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  supporter_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign additional images
CREATE TABLE campaign_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign updates
CREATE TABLE campaign_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign comments
CREATE TABLE campaign_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  privy_user_id TEXT,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  privy_user_id TEXT,
  amount DECIMAL(12,2) NOT NULL,
  name TEXT,
  email TEXT,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_campaigns_privy_user_id ON campaigns(privy_user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_images_campaign_id ON campaign_images(campaign_id);
CREATE INDEX idx_campaign_updates_campaign_id ON campaign_updates(campaign_id);
CREATE INDEX idx_campaign_comments_campaign_id ON campaign_comments(campaign_id);
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_privy_user_id ON donations(privy_user_id);

-- Enable row-level security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Campaigns: creators can update their own campaigns, everyone can view public campaigns
CREATE POLICY "Creators can manage their campaigns" ON campaigns
  FOR ALL USING (privy_user_id = auth.jwt() ->> 'sub');
  
CREATE POLICY "Public campaigns are viewable by everyone" ON campaigns
  FOR SELECT USING (privacy = 'public');

-- Campaign images: follow campaign access rules
CREATE POLICY "Campaign images follow campaign access" ON campaign_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_id AND 
      (c.privy_user_id = auth.jwt() ->> 'sub' OR c.privacy = 'public')
    )
  );

-- Campaign updates: follow campaign access rules
CREATE POLICY "Campaign updates follow campaign access" ON campaign_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_id AND 
      (c.privy_user_id = auth.jwt() ->> 'sub' OR c.privacy = 'public')
    )
  );

-- Campaign comments: creators can manage, everyone can view
CREATE POLICY "Creators can manage comments" ON campaign_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_id AND c.privy_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Everyone can view comments" ON campaign_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_id AND c.privacy = 'public'
    )
  );

-- Donations: donors can see their own donations, campaign creators can see all donations
CREATE POLICY "Donors can see their own donations" ON donations
  FOR SELECT USING (privy_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Campaign creators can see all donations" ON donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_id AND c.privy_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Functions to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats_on_donation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE campaigns
    SET 
      raised_amount = raised_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE campaigns
    SET 
      raised_amount = raised_amount + NEW.amount,
      supporter_count = supporter_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.payment_status != 'completed' AND OLD.payment_status = 'completed' THEN
    UPDATE campaigns
    SET 
      raised_amount = raised_amount - OLD.amount,
      supporter_count = supporter_count - 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats_on_donation();