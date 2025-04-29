import { Navigate } from 'react-router';
import { Button } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { useAuthentication } from '@/contexts/Authentication';

export default function SignInPage() {
  const { session, signIn } = useAuthentication();
  const notifications = useNotifications();

  const handleClickSignIn = () => {
    signIn();

    notifications.show('SignIn', { severity: 'success', autoHideDuration: 1000 });
  };

  if (session?.user) {
    return <Navigate to="/" replace />;
  }

  return <Button onClick={handleClickSignIn}>로그인</Button>;
}
