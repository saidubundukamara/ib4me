import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, Users, Star, PiggyBank, Archive, Book } from 'lucide-react';

const FundraisingTips = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Tips' },
    { id: 'storytelling', name: 'Storytelling' },
    { id: 'promotion', name: 'Promotion' },
    { id: 'engagement', name: 'Donor Engagement' },
    { id: 'visual', name: 'Visual Content' },
  ];

  const tips = [
    {
      id: 1,
      title: 'Tell a compelling story',
      description:
        'Share personal details and explain why your cause matters. Be authentic and honest about your situation.',
      category: 'storytelling',
      icon: <Book className="h-6 w-6 text-ib4me-purple" />,
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 2,
      title: 'Use high-quality photos',
      description:
        'Include clear, high-resolution images that show your cause. People respond to visual content more strongly than text alone.',
      category: 'visual',
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      color: 'bg-ib4me-blue',
    },
    {
      id: 3,
      title: 'Share on social media',
      description:
        'Share your fundraiser across all your social platforms. Ask friends and family to share with their networks too.',
      category: 'promotion',
      icon: <Users className="h-6 w-6 text-green-600" />,
      color: 'bg-ib4me-green',
    },
    {
      id: 4,
      title: 'Send personalized thank yous',
      description:
        'Send a personal thank you message to each donor. This builds goodwill and encourages them to share your fundraiser.',
      category: 'engagement',
      icon: <Star className="h-6 w-6 text-yellow-600" />,
      color: 'bg-ib4me-yellow',
    },
    {
      id: 5,
      title: 'Set a specific goal',
      description:
        'Be specific about how much you need and why. Break down how the funds will be used to address your need.',
      category: 'storytelling',
      icon: <PiggyBank className="h-6 w-6 text-ib4me-purple" />,
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 6,
      title: 'Post regular updates',
      description:
        'Keep supporters informed about your progress and how donations are making a difference. This builds trust and encourages more donations.',
      category: 'engagement',
      icon: <Archive className="h-6 w-6 text-red-600" />,
      color: 'bg-ib4me-pink',
    },
    {
      id: 7,
      title: 'Include video content',
      description:
        'Add a short video to your fundraiser. It could be you explaining your story or showing the impact of donations.',
      category: 'visual',
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      color: 'bg-ib4me-blue',
    },
    {
      id: 8,
      title: 'Email your contacts',
      description:
        'Send personalized emails to your contact list. Direct email is one of the most effective fundraising channels.',
      category: 'promotion',
      icon: <Users className="h-6 w-6 text-green-600" />,
      color: 'bg-ib4me-green',
    },
    {
      id: 9,
      title: 'Use specific examples',
      description:
        'Instead of saying "your donation helps," say "your $50 donation provides a week of meals." Specific examples are more compelling.',
      category: 'storytelling',
      icon: <Book className="h-6 w-6 text-ib4me-purple" />,
      color: 'bg-ib4me-light-purple',
    },
    {
      id: 10,
      title: 'Create urgency',
      description:
        "If appropriate, communicate time-sensitivity. If there's a deadline or urgent need, make that clear to potential donors.",
      category: 'promotion',
      icon: <Archive className="h-6 w-6 text-red-600" />,
      color: 'bg-ib4me-pink',
    },
    {
      id: 11,
      title: 'Show your gratitude publicly',
      description:
        'Acknowledge donors in updates (with their permission). Public recognition encourages more donations.',
      category: 'engagement',
      icon: <Star className="h-6 w-6 text-yellow-600" />,
      color: 'bg-ib4me-yellow',
    },
    {
      id: 12,
      title: 'Optimize for mobile',
      description:
        'Make sure your photos and text look good on mobile devices. Many donors will view your fundraiser on their phones.',
      category: 'visual',
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      color: 'bg-ib4me-blue',
    },
  ];

  // Filter tips based on active category
  const filteredTips = tips.filter(
    (tip) => activeCategory === 'all' || tip.category === activeCategory,
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

      {/* Tips Grid */}
      <section className="page-section">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTips.map((tip) => (
              <Card
                key={tip.id}
                className="h-full transition-all hover:shadow-md hover:border-ib4me-purple/50"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 ${tip.color} rounded-full flex items-center justify-center mb-4`}
                  >
                    {tip.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Tips Section */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <h2 className="heading-md mb-4 text-center">Advanced Fundraising Strategies</h2>
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to take your fundraiser to the next level? Try these proven advanced strategies.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Create a Fundraising Team</h3>
              <p className="text-muted-foreground mb-4">
                Multiply your fundraising potential by recruiting friends and family to join your
                team. Each team member can share with their own network, dramatically increasing
                your reach.
              </p>
              <Button asChild>
                <Link to="/team-fundraising">Learn About Team Fundraising</Link>
              </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Host a Fundraising Event</h3>
              <p className="text-muted-foreground mb-4">
                Consider organizing an in-person or virtual event to boost donations. Events create
                urgency and provide a social incentive for people to contribute to your cause.
              </p>
              <Button asChild>
                <Link to="/fundraising-ideas">Explore Event Ideas</Link>
              </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Secure Matching Donations</h3>
              <p className="text-muted-foreground mb-4">
                Ask a generous donor, local business, or your employer to match donations up to a
                certain amount. Matching gifts can double your fundraising impact.
              </p>
              <Button variant="outline">Download Matching Guide</Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Create Donation Tiers</h3>
              <p className="text-muted-foreground mb-4">
                Offer specific giving levels with explanations of what each amount provides. This
                helps donors visualize the impact of their contribution.
              </p>
              <Button variant="outline">View Example Tiers</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Advice */}
      <section className="page-section">
        <div className="container-custom">
          <h2 className="heading-md mb-8 text-center">Expert Advice</h2>

          <div className="bg-ib4me-light-purple/30 rounded-lg p-8 border border-ib4me-purple/20">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3">
                <div className="aspect-square rounded-full overflow-hidden w-32 h-32 mx-auto md:mx-0">
                  <img
                    src="https://source.unsplash.com/photo-1581091226825-a6a2a5aee158"
                    alt="Fundraising Expert"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="font-bold text-xl mb-2">From Our Fundraising Expert</h3>
                <p className="text-lg mb-4">
                  "The most successful fundraisers combine a compelling narrative with consistent
                  engagement. Don't just set up your page and wait - actively reach out, update
                  regularly, and personally thank your supporters."
                </p>
                <p className="text-muted-foreground">
                  — Michelle Williams, Head of Fundraiser Success at Ib4me
                </p>

                <Button className="mt-6" asChild>
                  <Link to="/fundraising-blog">Read Expert Articles</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="page-section bg-ib4me-purple text-white text-center">
        <div className="container-custom">
          <h2 className="heading-md mb-4">Ready to Put These Tips into Action?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Start your fundraiser today and implement these effective strategies to maximize your
            success.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/how-to-start">Start Your Fundraiser</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default FundraisingTips;
