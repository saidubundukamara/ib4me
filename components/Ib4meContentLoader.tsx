import Image from "next/image";
import Logo from "@/public/assets/ib4melogo.png";

export default function Ib4meContentLoader() {
  return (
    <div className="flex min-h-[200px] sm:min-h-[280px] w-full flex-col items-center justify-center gap-5">
      <div
        className="rounded-2xl bg-white px-7 py-5"
        style={{
          boxShadow:
            "0 0 0 1px rgba(0,113,45,0.08), 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <Image
          src={Logo}
          alt="ib4me"
          width={120}
          height={48}
          priority
          className="h-11 w-auto"
        />
      </div>
      <div className="flex gap-[7px]" aria-label="Loading">
        <span className="ib4me-loader__dot ib4me-loader__dot--1" />
        <span className="ib4me-loader__dot ib4me-loader__dot--2" />
        <span className="ib4me-loader__dot ib4me-loader__dot--3" />
      </div>
    </div>
  );
}
