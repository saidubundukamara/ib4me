import { useState } from 'react';
import FilterCampaign from '@/components/Campaigns/FilterCampaign';
import { Navbar } from '@/components/utils/Navbar';
import { Button } from '@/components/ui/button';
import CampaignCard from '@/components/Campaigns/campaign-card';
import { campaigns } from '@/components/Campaigns/campaign-data';
import Footer from '@/components/utils/Footer';
import Search from '@/components/Campaigns/Search';
import { Link, useNavigate } from 'react-router-dom';

const Campaigns = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/create-campaign');
  };

  return (
    <>
      <Navbar />
      <section className="py-8 md:py-16">
        <div className="mx-auto max-w-screen-xl container px-6 sm:px-0">
          {/* Text Content */}
          <div className="space-y-3 my-7 md:space-y-6">
            <h2 className="text-balance text-4xl font-medium lg:text-5xl">
              Browse fundraisers by category.
            </h2>
            <p>
              People around Sierra Leone and the world are raising money for what they are
              passionate about..
            </p>
            <Button onClick={handleClick} className="w-full cursor-pointer font-pt-serif sm:w-auto">
              Start a Campaign
            </Button>
          </div>
          {/* Centered Search & Filter */}
          <div className="flex flex-col items-center space-y-6">
            <Search />
            <FilterCampaign
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedUrgency={selectedUrgency}
              setSelectedUrgency={setSelectedUrgency}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} {...campaign} />
            ))}
          </div>
        </div>
      </section>
      <div className="flex flex-col items-center justify-center space-y-3 py-8 md:py-16">
        <h2 className="text-balance font-Lora my-5 text-3xl font-medium lg:text-4xl">
          Start a fundraiser for yourself or someone else.
        </h2>
        <Button className="w-full cursor-pointer font-pt-serif sm:w-auto">
          <Link to="/more-campaigns" className="flex items-center justify-center gap-2">
            Explore more Campaigns
          </Link>
        </Button>
      </div>
      <Footer />
    </>
  );
};

export default Campaigns;
