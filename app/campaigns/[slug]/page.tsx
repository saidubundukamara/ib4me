type PageParams = {
  params: { slug: string };
};

export default function CampaignDetailPage({ params }: PageParams) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Campaign Detail</h1>
      <p className="text-sm text-gray-600 mt-2">Slug: {params.slug}</p>
    </div>
  );
}


