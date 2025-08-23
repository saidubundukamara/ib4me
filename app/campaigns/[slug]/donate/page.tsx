type PageParams = {
  params: { slug: string };
};

export default function CampaignDonatePage({ params }: PageParams) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Donate</h1>
      <p className="text-sm text-gray-600 mt-2">Support campaign: {params.slug}</p>
    </div>
  );
}


