export default function UserNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Manage preferences and view activity.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border p-4 bg-white/80 dark:bg-white/5">
          <h3 className="font-medium">Activity</h3>
          <div className="mt-3 divide-y">
            {["Donation received $120","Comment on your campaign","Payout approved"].map((n,i)=> (
              <div key={i} className="py-3 flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500"/>
                <span className="text-gray-700 dark:text-gray-200">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5">
          <h3 className="font-medium">Preferences</h3>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4"/>
              <span>Email alerts</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4"/>
              <span>Push notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}


