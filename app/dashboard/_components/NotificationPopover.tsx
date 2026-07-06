import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  date: string;
  read: boolean;
  link?: string | null;
}

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onViewAll?: () => void;
}

const NotificationPopover = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onViewAll,
}: NotificationPopoverProps) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'donation': return '💰';
      case 'payout': return '💸';
      case 'campaign': return '📢';
      case 'verification': return '✅';
      case 'system': return '🔔';
      default: return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative rounded-full hover:bg-muted"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 rounded-2xl border-0 shadow-lg" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => {
                onMarkAllAsRead();
                toast("Marked all as read", {
                  description: "All notifications have been marked as read."
                });
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl mb-2 transition-all hover:bg-muted/50 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1">{getTypeIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      {notification.title ? (
                        <>
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-foreground`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </>
                      ) : (
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-foreground line-clamp-2`}>
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(notification.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            onMarkAsRead(notification.id);
                            toast( "Marked as read");
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          onDelete(notification.id);
                          toast.success("Notification deleted");
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll be notified about donations, milestones, and updates here.
              </p>
            </div>
          )}
        </ScrollArea>

        {/* View all footer */}
        <div className="border-t border-border p-3">
          <Link
            href="/dashboard/notifications"
            onClick={() => { setOpen(false); onViewAll?.(); }}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-semibold text-primary hover:bg-primary/8 transition-colors"
          >
            View all notifications
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
