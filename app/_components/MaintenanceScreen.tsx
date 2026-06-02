import Image from "next/image";
import { Wrench } from "lucide-react";
import Ib4meLogo from "@/public/assets/ib4melogo.png";

export default function MaintenanceScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-full max-w-md space-y-6">
        <Image
          src={Ib4meLogo}
          alt="IB4ME"
          width={140}
          height={40}
          priority
          className="mx-auto h-auto w-[140px]"
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <Wrench className="h-8 w-8 text-orange-500" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          We&apos;ll be right back
        </h1>

        <p className="text-muted-foreground">
          IB4ME is currently down for scheduled maintenance. We&apos;re working to
          improve your experience and will be back online shortly. Thank you for
          your patience.
        </p>
      </div>
    </main>
  );
}
