import Image from "next/image";
import Logo from "@/public/assets/ib4melogo.png";

export default function Loading() {
  return (
    <div className="ib4me-loader">
      {/* Top progress bar sweep */}
      <div className="ib4me-loader__bar" />

      {/* Ambient blobs */}
      <div className="ib4me-loader__blob ib4me-loader__blob--green" />
      <div className="ib4me-loader__blob ib4me-loader__blob--orange" />
      <div className="ib4me-loader__blob ib4me-loader__blob--lime" />

      {/* Centre card */}
      <div className="ib4me-loader__card">
        {/* Ripple rings */}
        <span className="ib4me-loader__ring ib4me-loader__ring--1" />
        <span className="ib4me-loader__ring ib4me-loader__ring--2" />
        <span className="ib4me-loader__ring ib4me-loader__ring--3" />

        {/* Logo */}
        <div className="ib4me-loader__logo-wrap">
          <Image
            src={Logo}
            alt="ib4me"
            width={140}
            height={56}
            className="ib4me-loader__logo"
            priority
          />
        </div>

        {/* Tagline */}
        <p className="ib4me-loader__tagline">Put Fo Wɛlbɔdi</p>

        {/* Bouncing dots */}
        <div className="ib4me-loader__dots" aria-label="Loading">
          <span className="ib4me-loader__dot ib4me-loader__dot--1" />
          <span className="ib4me-loader__dot ib4me-loader__dot--2" />
          <span className="ib4me-loader__dot ib4me-loader__dot--3" />
        </div>
      </div>
    </div>
  );
}
