type PageParams = {
  params: { id: string };
};

export default function AdminCampaignDetailPage({ params }: PageParams) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Campaign Detail</h2>
      <p className="text-sm text-gray-600 mt-2">Campaign ID: {params.id}</p>
    </div>
  );
}


