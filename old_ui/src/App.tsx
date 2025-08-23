import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Login from './Pages/Auth/Login/Login';
import Campaigns from './Pages/Campaigns/Campaigns';
import Register from './Pages/Auth/SignUp/Register';
import CreateFundraisers from './Pages/CreateCampaigns/CreateFundraisers';
import Settings from './Pages/Profile/Settings/Settings';
import Payments from './Pages/Payment/[Campaignid]/payment/Payments';
import Campaign from './Pages/Campaign/[id]/Campaign';
import MyFundraisers from './Pages/Profile/Fundraisers/MyFundraisers';
import About from './Pages/NavLinksPages/About';
import HowIb4meWorks from './Pages/NavLinksPages/HowIb4meWorks';
import DiscoverCampaigns from './Pages/Campaigns/DiscoverCampaigns';
import SupportSpace from './Pages/NavLinksPages/SupportSpace';
import Guarantee from './Pages/NavLinksPages/Guarantee';
import Impact from './Pages/Profile/Impact/Impact';
import CampaignSettings from './Pages/Profile/Fundraisers/MyCampaigns/[id]/Settings';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/more-campaigns" element={<DiscoverCampaigns />} />
      <Route path="/auth/sign-in" element={<Login />} />
      <Route path="/auth/sign-up" element={<Register />} />
      <Route path="/campaign/:id" element={<Campaign />} />
      <Route path="/how-ib4me-works" element={<About />} />
      <Route path="/supporter-space" element={<SupportSpace />} />
      <Route path="/guarantee" element={<Guarantee />} />
      <Route path="/how-to-start-an-ib4me" element={<HowIb4meWorks />} />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/create-campaign" element={<CreateFundraisers />} />
        <Route path="/profile-settings" element={<Settings />} />
        <Route path="/my-impact" element={<Impact />} />
        <Route path="/donate/:campaignId/payment" element={<Payments />} />
        <Route path="/campaign/:campaignId/settings" element={<CampaignSettings />} />
        <Route path="/my-fundraisers" element={<MyFundraisers />} />
      </Route>
    </Routes>
  );
}

export default App;
