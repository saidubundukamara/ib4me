import { useState } from 'react';
import Ib4me from '@/assets/How_ib4me_works.png';

const Ib4meVideo = () => {
  const [isVideoPoppedUp, setVideoPopUp] = useState(false);
  return (
    <section>
      <div className="flex justify-center items-center text-neutral-800">
        <div className="max-w-screen-2xl mx-auto px-4 py-12 md:py-20 md:px-8">
          <div className="mx-auto py-10 space-y-6  md:space-y-12">
            <h2 className="text-balance text-3xl font-semibold font-Lora lg:text-4xl">
              How Ib4me Works
            </h2>
          </div>
          <div className="relative">
            <img
              src={Ib4me}
              width={800}
              height={600}
              className="mx-auto max-w-5xl rounded-lg"
              alt=""
            />
            <button
              className="absolute w-16 h-16 rounded-full inset-0 m-auto duration-150 bg-primary cursor-pointer hover:bg-primary  text-white"
              onClick={() => setVideoPopUp(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-6 h-6 m-auto"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isVideoPoppedUp ? (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center">
          <div
            className="absolute inset-0 w-full h-full bg-black/50"
            onClick={() => setVideoPopUp(false)}
          ></div>
          <div className="px-4 relative">
            <button
              className="w-12 h-12 mb-5 rounded-full duration-150 bg-primary hover:bg-primary text-white"
              onClick={() => setVideoPopUp(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5  m-auto"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <video className="rounded-lg w-full max-w-5xl" controls autoPlay={true}>
              <source
                src="https://raw.githubusercontent.com/sidiDev/remote-assets/main/FloatUI.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      ) : (
        ''
      )}
    </section>
  );
};

export default Ib4meVideo;
