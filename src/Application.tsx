import { Outlet } from 'react-router';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DashboardIcon from '@mui/icons-material/Dashboard';
import type { Navigation } from '@toolpad/core';
import { Branding } from '@toolpad/core/AppProvider';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { useAuthentication } from '@/contexts/Authentication';

const branding: Branding = {
  title: 'Example',
  logo: <img src="/vite.svg" alt="logo" />,
  homeUrl: '/dashboard',
};

const navigation: Navigation = [
  {
    segment: 'dashboard',
    title: '대시보드',
    icon: <DashboardIcon />,
  },
  {
    segment: 'tenant-management',
    title: '테넌트 관리',
    icon: <AccountTreeIcon />,
    pattern: 'tenant-management{/:id}*',
  },
];

export default function App() {
  const { session, signIn, signOut } = useAuthentication();

  const authentication = { signIn, signOut };

  return (
    <ReactRouterAppProvider branding={branding} navigation={navigation} session={session} authentication={authentication}>
      <Outlet />
    </ReactRouterAppProvider>
  );
}
