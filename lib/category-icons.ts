import {
  HeartPulse,
  GraduationCap,
  Siren,
  Users,
  HandHeart,
  Baby,
  TreePine,
  LayoutGrid,
  Heart,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  HeartPulse,
  GraduationCap,
  Siren,
  Users,
  HandHeart,
  Baby,
  TreePine,
  LayoutGrid,
  Heart,
  // Legacy icon names from old seeds — map to closest Lucide equivalent
  MdOutlineHealthAndSafety: HeartPulse,
  FaHeartbeat: HeartPulse,
  GiMedicines: HeartPulse,
  TfiSupport: HandHeart,
  MdOutlineMedicalServices: HeartPulse,
  MdOutlineDeviceThermostat: LayoutGrid,
};

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return LayoutGrid;
  return iconMap[iconName] ?? LayoutGrid;
}
