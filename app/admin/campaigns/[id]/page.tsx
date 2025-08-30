type PageParams = {
  params: { id: string };
};

export default async function AdminCampaignDetailPage({ params }: PageParams) {
  const { id } = await params;
  return (
    <div>
      <h2 className="text-xl font-semibold">Campaign Detail</h2>
      <p className="text-sm text-gray-600 mt-2">Campaign ID: {id}</p>
    </div>
  );
}


