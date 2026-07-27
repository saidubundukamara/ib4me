import { settingService } from "@/services";
import DynamicLegalPage from "@/app/_components/DynamicLegalPage";
import PrivacyContent from "./PrivacyContent";

export default async function PrivacyPage() {
  try {
    const legal = await settingService.getLegalDocuments();
    if (legal.privacyPolicy?.content?.trim()) {
      return (
        <DynamicLegalPage
          type="privacy"
          content={legal.privacyPolicy.content}
          effectiveDate={legal.privacyPolicy.effectiveDate}
          lastUpdatedAt={legal.privacyPolicy.lastUpdatedAt}
        />
      );
    }
  } catch {
    // Fall through to hardcoded content
  }
  return <PrivacyContent />;
}
