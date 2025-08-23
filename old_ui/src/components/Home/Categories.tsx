import { Link } from 'react-router-dom';
import { RiUserCommunityFill } from 'react-icons/ri';
import { TfiSupport } from 'react-icons/tfi';
import { MdOutlineDeviceThermostat, MdOutlineHealthAndSafety } from 'react-icons/md';
import { RiMentalHealthLine } from 'react-icons/ri';
import { FaResearchgate } from 'react-icons/fa';

const category = [
  {
    id: 1,
    name: 'Treatments & Procedures',
    icon: MdOutlineHealthAndSafety,
    href: '/discover/medical',
  },
  { id: 2, name: 'Research & Innovation', icon: FaResearchgate, href: '/discover/education' },
  { id: 3, name: 'Mental Health & Therapy', icon: RiMentalHealthLine, href: '/discover/emergency' },
  {
    id: 4,
    name: 'Equipment & Devices',
    icon: MdOutlineDeviceThermostat,
    href: '/discover/memorial',
  },
  { id: 5, name: 'Patient & Caregiver Support', icon: TfiSupport, href: '/discover/community' },
  {
    id: 6,
    name: 'Community Health Initiatives',
    icon: RiUserCommunityFill,
    href: '/discover/nonprofit',
  },
];
const Categories = () => {
  return (
    <section className="py-14 sm:py-20">
      <div className="container max-w-5xl mx-auto px-4 md:px-6">
        <h2 className="text-2xl font-Lora md:text-3xl font-bold text-center mb-12">
          Find a fundraiser by category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {category.map((category) => (
            <Link
              key={category.id}
              to={category.href}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-full mb-3">
                <category.icon className="h-10 w-10 text-green-300" />
              </div>
              <span className="font-medium text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
