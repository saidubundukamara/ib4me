import { Navbar } from '@/components/utils/Navbar';
import StatsSection from '@/components/Home/StatsSection';
import { Hero } from '@/components/Home/Hero';
import Campaigns from '@/components/Home/Campaigns';
import Footer from '@/components/utils/Footer';
import GetStarted from '@/components/Home/GetStarted';
import Section from '@/components/Home/Section';
import Ib4meVideo from '@/components/Home/Ib4meVideo';
import Fundraise from '@/components/Home/Fundraise';
import Card from '@/components/Home/Card';
import Stories from '@/components/Home/Stories';
import Categories from '@/components/Home/Categories';

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <StatsSection />
      <GetStarted />
      <Campaigns />
      <Categories />
      <Section />
      <Ib4meVideo />
      <Card />
      <Stories />
      <Fundraise />
      <Footer />
    </div>
  );
};

export default Home;
