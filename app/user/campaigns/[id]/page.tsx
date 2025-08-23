type PageParams = {
  params: { id: string };
};

export default function UserCampaignDetailPage({ params }: PageParams) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Campaign</h2>
      <p className="text-sm text-gray-600 mt-2">Campaign ID: {params.id}</p>
    </div>
  );
}


