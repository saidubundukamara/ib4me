import type { IconType } from "react-icons";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";

export type SocialProvider = {
  id: "google" | "facebook" | "apple";
  icon: IconType;
  hover: string;
  iconColor?: string;
};

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: "google", icon: FaGoogle, hover: "hover:bg-red-50 hover:border-red-200", iconColor: "text-red-500" },
  { id: "facebook", icon: FaFacebook, hover: "hover:bg-blue-50 hover:border-blue-200", iconColor: "text-blue-600" },
  { id: "apple", icon: FaApple, hover: "hover:bg-slate-50 hover:border-slate-200" },
];
