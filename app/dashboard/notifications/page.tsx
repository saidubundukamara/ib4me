

import { Card } from '@/components/ui/card';

type UserNotification = {
  id: string;
  message: string;
  date: string;
  read: boolean;
};

const dummyNotifications: UserNotification[] = [
  { id: '1', message: 'Welcome to the app! 🎉', date: '2025-10-01', read: false },
  { id: '2', message: 'Your profile was updated successfully.', date: '2025-10-02', read: true },
  { id: '3', message: 'New message received from Support.', date: '2025-10-03', read: false },
];

export default function UserNotificationsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
      {dummyNotifications.map((notification) => (
        <Card key={notification.id} className={`p-6 border border-border hover:shadow-md transition-all rounded-3xl ${!notification.read ? 'bg-primary/5' : ''}`}>
          <div className="flex items-start gap-4">
            <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-primary' : 'bg-muted'}`} />
            <div className="flex-1">
              <p className={`${!notification.read ? 'font-semibold' : ''} text-foreground`}>
                {notification.message}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{notification.date}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


