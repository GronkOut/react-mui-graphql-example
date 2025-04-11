import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import ContentManagementCreatePage from '@/pages/ContentManagement/Create';
import ContentManagementListPage from '@/pages/ContentManagement/List';
import ContentManagementReadPage from '@/pages/ContentManagement/Read';
import ContentManagementUpdatePage from '@/pages/ContentManagement/Update';
import DashboardPage from '@/pages/Dashboard';
import NotFoundPage from '@/pages/Error/NotFound';
import SignInPage from '@/pages/SignIn';
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
                      path: 'content-management',
                      children: [
                        {
                          path: '',
                          Component: ContentManagementListPage,
                        },
                        {
                          path: 'create',
                          Component: ContentManagementCreatePage,
                        },
                        {
                          path: ':id',
                          Component: ContentManagementReadPage,
                        },
                        {
                          path: ':id/edit',
                          Component: ContentManagementUpdatePage,
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
