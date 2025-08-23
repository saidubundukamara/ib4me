import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const FundraisingIdeas = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Ideas' },
    { id: 'event', name: 'Events' },
    { id: 'challenge', name: 'Challenges' },
    { id: 'community', name: 'Community' },
    { id: 'creative', name: 'Creative' },
  ];

  const ideas = [
    {
      id: 1,
      title: 'Virtual 5K Run',
      description:
        'Organize a virtual 5K where participants run in their own neighborhoods and track their progress. Charge a registration fee that goes toward your cause.',
      category: 'challenge',
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 2,
      title: 'Online Auction',
      description:
        'Host an online auction with donated items or services. Use social media to promote the auction and encourage bidding.',
      category: 'event',
      color: 'bg-ib4me-blue',
    },
    {
      id: 3,
      title: 'Skill Workshop',
      description:
        'Offer a virtual workshop teaching a skill you excel at (cooking, crafting, photography). Charge a registration fee that supports your cause.',
      category: 'creative',
      color: 'bg-ib4me-green',
    },
    {
      id: 4,
      title: 'Restaurant Percentage Night',
      description:
        'Partner with a local restaurant that agrees to donate a percentage of sales on a specific night to your cause.',
      category: 'community',
      color: 'bg-ib4me-yellow',
    },
    {
      id: 5,
      title: '30-Day Challenge',
      description:
        'Create a 30-day challenge (fitness, creativity, learning) and ask participants to donate or get sponsored for completing it.',
      category: 'challenge',
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 6,
      title: 'Video Game Tournament',
      description:
        'Organize an online gaming tournament with an entry fee. Stream the event live on platforms like Twitch to engage viewers.',
      category: 'event',
      color: 'bg-ib4me-blue',
    },
    {
      id: 7,
      title: 'Community Yard Sale',
      description:
        'Organize a community-wide yard sale where participants donate a portion of their sales to your cause.',
      category: 'community',
      color: 'bg-ib4me-green',
    },
    {
      id: 8,
      title: 'Art or Photo Sale',
      description:
        'Create and sell original artwork or photography, with proceeds benefiting your cause. Can be done online or in person.',
      category: 'creative',
      color: 'bg-ib4me-yellow',
    },
    {
      id: 9,
      title: 'Virtual Trivia Night',
      description:
        'Host an online trivia competition with an entry fee. Use video conferencing to create an interactive and fun experience.',
      category: 'event',
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 10,
      title: 'Social Media Challenge',
      description:
        'Create a viral challenge (like the Ice Bucket Challenge) where participants donate after completing it and nominate others.',
      category: 'challenge',
      color: 'bg-ib4me-blue',
    },
    {
      id: 11,
      title: 'Custom Merchandise',
      description:
        'Design and sell custom merchandise (t-shirts, mugs, stickers) related to your cause using print-on-demand services.',
      category: 'creative',
      color: 'bg-ib4me-green',
    },
    {
      id: 12,
      title: 'Local Business Partnership',
      description:
        'Partner with local businesses to create special products or services where a portion of sales benefits your cause.',
      category: 'community',
      color: 'bg-ib4me-yellow',
    },
  ];

  // Filter ideas based on active category
  const filteredIdeas = ideas.filter(
    (idea) => activeCategory === 'all' || idea.category === activeCategory,
  );

  return (
    <>
      {/* Filter Categories */}
      <section className="border-b">
        <div className="container-custom py-6">
          <div className="flex overflow-x-auto pb-2 space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? 'bg-ib4me-purple text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Ideas Grid */}
      <section className="page-section">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="h-full transition-all hover:shadow-md hover:border-ib4me-purple/50"
              >
                <CardContent className="p-6">
                  <div className={`w-3 h-3 ${idea.color} rounded-full mb-4`}></div>
                  <h3 className="font-bold text-lg mb-2">{idea.title}</h3>
                  <p className="text-muted-foreground">{idea.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Idea Spotlight */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <h2 className="heading-md mb-8 text-center">Spotlight: Team Challenge</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src="https://source.unsplash.com/photo-1500673922987-e212871fec22"
                alt="Team Challenge Fundraiser"
                className="rounded-lg shadow-md"
              />
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4">How It Works</h3>
              <p className="text-lg mb-6">
                Team challenges combine friendly competition with fundraising to create a highly
                engaging experience. Here's how to implement this idea:
              </p>

              <ol className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-ib4me-purple text-white rounded-full text-sm">
                    1
                  </span>
                  <span>
                    Form teams of 3-5 people based on departments, friend groups, or interests
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-ib4me-purple text-white rounded-full text-sm">
                    2
                  </span>
                  <span>
                    Set a specific challenge (fitness goals, volunteer hours, creative tasks)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-ib4me-purple text-white rounded-full text-sm">
                    3
                  </span>
                  <span>Create team fundraising pages linked to your main campaign</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-ib4me-purple text-white rounded-full text-sm">
                    4
                  </span>
                  <span>Set goals and track progress publicly to foster healthy competition</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-ib4me-purple text-white rounded-full text-sm">
                    5
                  </span>
                  <span>Offer prizes or recognition for the top fundraising teams</span>
                </li>
              </ol>

              <Button asChild>
                <Link to="/team-fundraising">Start a Team Fundraiser</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cause-Specific Ideas */}
      <section className="page-section">
        <div className="container-custom">
          <h2 className="heading-md mb-8 text-center">Ideas by Cause Type</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Medical Fundraisers</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Fitness challenges (steps, miles, workouts)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Medical awareness events</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Healthy cooking classes or recipe books</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Education Fundraisers</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Skill-sharing workshops</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Book drives or reading challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Educational webinars or courses</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Community Fundraisers</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Neighborhood improvement projects</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Cultural celebrations or festivals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Local business partnership days</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Emergency Relief</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Rapid response social campaigns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Supply drives with monetary donations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Virtual benefit concerts or performances</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Animal Causes</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Pet photo contests or calendars</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Dog walks or animal exercise challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Virtual animal therapy sessions</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Environmental Causes</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Cleanup events with sponsorships</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Plant-a-tree fundraising campaigns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-ib4me-purple mr-2">•</span>
                  <span>Sustainable product sales</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Planning Tools */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <h2 className="heading-md mb-4 text-center">Fundraising Planning Tools</h2>
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Use these resources to help plan and execute your fundraising idea successfully.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Event Planning Checklist</h3>
                <p className="text-muted-foreground mb-4">
                  A comprehensive checklist to ensure you've covered all aspects of planning your
                  fundraising event.
                </p>
                <Button variant="outline">Download PDF</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Budget Calculator</h3>
                <p className="text-muted-foreground mb-4">
                  Plan your fundraiser's expenses and projected income with this interactive
                  calculator.
                </p>
                <Button variant="outline">Use Calculator</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Promotion Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Email templates, social media posts, and other promotional materials for your
                  fundraiser.
                </p>
                <Button variant="outline">View Templates</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="page-section bg-ib4me-purple text-white text-center">
        <div className="container-custom">
          <h2 className="heading-md mb-4">Ready to Turn These Ideas Into Action?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Start your fundraiser today and implement these creative ideas to maximize your success.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/how-to-start">Start Your Fundraiser</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default FundraisingIdeas;
