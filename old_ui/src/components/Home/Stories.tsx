import VideoCarousel from '@/components/Campaigns/VideoCarousel';

const Stories = () => {
  const videos = [
    {
      id: 1,
      title: 'Cosmic Journey',
      src: '/video/video1.mp4',
      srcLow: '/video/video1-low.mp4',
      description: 'A masked traveler ventures through the cosmos in search of an elusive truth.',
    },
    {
      id: 2,
      title: 'Ocean Depths',
      src: '/video/video2.mp4',
      srcLow: '/video/video2-low.mp4',
      description:
        'A girl waits on a secluded shore, anticipating the arrival of the masked traveler.',
    },
    {
      id: 3,
      title: 'Nature Whisper',
      src: '/video/video3.mp4',
      srcLow: '/video/video3-low.mp4',
      description:
        'The traveler, immersed in nature, experiences profound emotions and goosebumps.',
    },
    {
      id: 4,
      title: 'Urban Rhythm',
      src: '/video/video4.mp4',
      srcLow: '/video/video4-low.mp4',
      description: 'A girl and boy eagerly wait for the traveler to arrive.',
    },
  ];

  return (
    <section className="bg-white py-8 md:py-16 ">
      <div className="my-2 mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-Lora font-semibold lg:text-4xl">
            Stories that will Inspire you
          </h2>
        </div>
      </div>
      <div>
        <VideoCarousel videos={videos} />
      </div>
    </section>
  );
};

export default Stories;
