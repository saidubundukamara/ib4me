"use client";

import React from "react";

export type DashboardNotification = {
  id: string;
  type: string;
  title?: string;
  message: string;
  date: string;
  read: boolean;
  link?: string | null;
};

type NotificationsContextValue = {
  notifications: DashboardNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  unreadCount: number;
};

export const NotificationsContext = React.createContext<NotificationsContextValue>({
  notifications: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  unreadCount: 0,
});

export function useNotifications() {
  return React.useContext(NotificationsContext);
}
