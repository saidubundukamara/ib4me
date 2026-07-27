import { settingService } from "@/services";
import DynamicLegalPage from "@/app/_components/DynamicLegalPage";
import TermsContent from "./TermsContent";

export default async function TermsPage() {
  try {
    const legal = await settingService.getLegalDocuments();
    if (legal.termsOfService?.content?.trim()) {
      return (
        <DynamicLegalPage
          type="terms"
          content={legal.termsOfService.content}
          effectiveDate={legal.termsOfService.effectiveDate}
          lastUpdatedAt={legal.termsOfService.lastUpdatedAt}
        />
      );
    }
  } catch {
    // Fall through to hardcoded content
  }
  return <TermsContent />;
}
