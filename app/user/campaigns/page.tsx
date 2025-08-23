import Card from "../_components/../_components/Card";
import ProgressBar from "../_components/../_components/ProgressBar";

export default function UserCampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Campaigns</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage your campaigns.</p>
        </div>
        <a href="/user/campaigns/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition">New Campaign</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">Healthcare Support #{i}</h3>
                <p className="text-xs text-gray-500 mt-1">Updated 2 days ago</p>
              </div>
              <a href={`/user/campaigns/${i}`} className="text-sm text-indigo-600">Open</a>
            </div>
            <div className="mt-4">
              <ProgressBar value={i * 25} />
              <div className="mt-1 text-xs text-gray-500">{i * 25}% of goal</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


