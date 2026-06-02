import type { Metadata } from "next";
import MaintenanceScreen from "../_components/MaintenanceScreen";
import { settingService } from "@/services/SettingService";

export const metadata: Metadata = {
  title: "Under Maintenance",
  description: "ib4me is currently under maintenance. Please check back later.",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  let contact = null;
  let social = null;

  try {
    [contact, social] = await Promise.all([
      settingService.getContactSettings(),
      settingService.getSocialSettings(),
    ]);
  } catch (error) {
    console.error("Failed to load maintenance page settings:", error);
  }

  return <MaintenanceScreen contact={contact} social={social} />;
}
