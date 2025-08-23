import { supabase } from '@/lib/supabase';

// Campaign types
export interface Campaign {
  title: string;
  category: string;
  urgency: string;
  beneficiary: string;
  summary: string;
  story: string;
  cover_image_url: string | null;
  additional_image_urls: string[] | null;
  video_url: string;
  goal: number;
  deadline: string;
  privacy: string;
  show_donors: boolean;
  allow_anonymous: boolean;
  terms_agreed: boolean;
  privy_user_id: string; // <-- using privy_user_id directly
  status: 'draft' | 'submitted' | 'approved' | 'rejected'; // optional, based on logic
  tags?: string[]; // optional
  location?: string; // optional
  createdAt?: Date; // optional
  updatedAt?: Date; // optional
}

// Comment types
export interface Comment {
  id?: string;
  campaign_id: string;
  privy_user_id: string;
  user_name: string;
  content: string;
  created_at?: string;
}

// Donation types
export interface Donation {
  id?: string;
  campaign_id: string;
  privy_user_id?: string;
  amount: number;
  message?: string;
  anonymous?: boolean;
  created_at?: string;
}

// Campaign services
export const campaignService = {
  async createCampaign(campaign: Campaign) {
    const { data, error } = await supabase.from('campaigns').insert(campaign).select().single();

    if (error) throw error;
    return data;
  },

  async getCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCampaignById(id: string) {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  },

  async getUserCampaigns(privyUserId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('privy_user_id', privyUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateCampaign(id: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Comment services
export const commentService = {
  async createComment(comment: Comment) {
    const { data, error } = await supabase.from('comments').insert(comment).select().single();

    if (error) throw error;
    return data;
  },

  async getCampaignComments(campaignId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Donation services
export const donationService = {
  async createDonation(donation: Donation) {
    const { data, error } = await supabase.from('donations').insert(donation).select().single();

    if (error) throw error;
    return data;
  },

  async getCampaignDonations(campaignId: string) {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserDonations(privyUserId: string) {
    const { data, error } = await supabase
      .from('donations')
      .select('*, campaigns(*)')
      .eq('privy_user_id', privyUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
