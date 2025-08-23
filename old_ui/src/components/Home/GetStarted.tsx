import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateDonation from '../../assets/Create-fundraiser.jpg';
import ShareDonation from '../../assets/recieve-donations.png';
import RecieveDonations from '../../assets/share-fundraiser.png';

const features = [
  {
    step: 'Step 1',
    content: 'Use our tool to create your fundraising Campaign.',
    image: CreateDonation,
  },
  { step: 'Step 2', content: 'Reach Donors by sharing.', image: ShareDonation },
  { step: 'Step 3', content: 'Securely recieve funds.', image: RecieveDonations },
];

const GetStarted = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 3.33);
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="py-10 text-white p-8 md:p-12 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-Lora font-extrabold mb-10 md:mb-12 text-center text-neutral-900">
          Fundraising on Ib4me is easy, powerful, and trusted.
        </h2>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Features List */}
          <div className="order-2 md:order-1 space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                    index === currentFeature ? 'bg-green-400 scale-110' : 'bg-gray-500'
                  } border-2 ${index === currentFeature ? 'border-green-400' : 'border-gray-400'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {index <= currentFeature ? (
                    <span className="text-white text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-white text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold text-neutral-900">
                    {feature.step}
                  </h3>
                  <p className="text-sm md:text-lg text-neutral-800">{feature.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image Cards */}
          <div className="order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg shadow-lg">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover transition-transform transform"
                        width={1000}
                        height={500}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"></div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GetStarted;
