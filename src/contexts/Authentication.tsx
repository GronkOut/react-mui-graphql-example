import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@toolpad/core/AppProvider';

interface AuthenticationContextProps {
  loading: boolean;
  session: Session | null;
  signIn: () => void;
  signOut: () => void;
}

interface AuthenticationProviderProps {
  children: ReactNode;
}

const AuthenticationContext = createContext<AuthenticationContextProps | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthentication() {
  const auth = useContext(AuthenticationContext);

  if (!auth) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider');
  }

  return auth;
}

export function AuthenticationProvider({ children }: AuthenticationProviderProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      setSession({
        user: {
          id: parsedUser.email,
          name: parsedUser.name,
          email: parsedUser.email,
          image: parsedUser.image,
        },
      });
    }

    setLoading(false);
  }, []);

  const signIn = () => {
    const session: Session = {
      user: {
        id: 'gronkout@ncsoft.com',
        name: 'gronkout',
        email: 'gronkout@ncsoft.com',
        image: null,
      },
    };

    localStorage.setItem('user', JSON.stringify(session.user));

    setSession(session);
  };

  const signOut = () => {
    localStorage.removeItem('user');

    setSession(null);

    location.href = '/intro';
  };

  return <AuthenticationContext value={{ loading, session, signIn, signOut }}>{children}</AuthenticationContext>;
}
