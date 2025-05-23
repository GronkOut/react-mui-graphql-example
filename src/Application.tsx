import { Outlet } from 'react-router';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import type { Navigation } from '@toolpad/core';
import { Branding } from '@toolpad/core/AppProvider';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { useAuthentication } from '@/contexts/Authentication';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    createButtonName: string;
    rowSelectionModel: GridRowSelectionModel;
    onClickCreate: () => void;
    onClickDelete: () => void;
  }
}

const branding: Branding = {
  title: 'System Admin',
  logo: <img src="/images/favicon196x196.png" alt="logo" />,
  homeUrl: '/',
};

const artFashion: Navigation = [
  {
    kind: 'header',
    title: 'Art Fashion',
  },
  {
    segment: 'tenant',
    title: '테넌트 관리',
    icon: <AccountTreeIcon />,
    pattern: 'tenant{/:tenantId}*',
  },
  {
    segment: 'content',
    title: '콘텐츠 관리',
    icon: <NewspaperIcon />,
    pattern: 'content{/:contentId}*',
  },
];

const navigation: Navigation = [
  ...artFashion,
  {
    kind: 'divider',
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
