import React from 'react';
import { useAuthContext } from './AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UserProfileProps {
  className?: string;
}

/**
 * UserProfile component displays the authenticated user's information and provides logout functionality
 */
const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { isAuthenticated, userEmail, logout } = useAuthContext();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{userEmail || 'No email available'}</p>
        </div>

        <Button variant="outline" onClick={logout} className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
