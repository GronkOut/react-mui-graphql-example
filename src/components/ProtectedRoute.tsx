import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useAuthentication } from '@/contexts/Authentication';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuthentication();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
