import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import DashboardPage from '@/pages/Dashboard';
import NotFoundPage from '@/pages/Error/NotFound';
import SignInPage from '@/pages/SignIn';
import TenantManagementCreatePage from '@/pages/TenantManagement/Create';
import TenantManagementListPage from '@/pages/TenantManagement/List';
import TenantManagementReadPage from '@/pages/TenantManagement/Read';
import TenantManagementUpdatePage from '@/pages/TenantManagement/Update';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import DefaultLayout from '@/components/DefaultLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Application from './Application';
import { AuthenticationProvider } from '@/contexts/Authentication';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});

createRoot(document.getElementById('application')!).render(
  <StrictMode>
    <AuthenticationProvider>
      <ApolloProvider client={client}>
        <RouterProvider
          router={createBrowserRouter([
            {
              Component: Application,
              children: [
                {
                  path: 'sign-in',
                  Component: SignInPage,
                },
                {
                  path: '/',
                  element: (
                    <ProtectedRoute>
                      <DefaultLayout />
                    </ProtectedRoute>
                  ),
                  children: [
                    {
                      path: 'dashboard',
                      Component: DashboardPage,
                    },
                    {
                      path: 'tenant-management',
                      children: [
                        {
                          path: '',
                          Component: TenantManagementListPage,
                        },
                        {
                          path: 'create',
                          Component: TenantManagementCreatePage,
                        },
                        {
                          path: ':id',
                          Component: TenantManagementReadPage,
                        },
                        {
                          path: ':id/edit',
                          Component: TenantManagementUpdatePage,
                        },
                      ],
                    },
                  ],
                },
                {
                  path: '*',
                  Component: NotFoundPage,
                },
              ],
            },
          ])}
        />
      </ApolloProvider>
    </AuthenticationProvider>
  </StrictMode>,
);
