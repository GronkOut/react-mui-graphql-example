import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import ContentManagementCreatePage from '@/pages/ContentManagement/Create';
import ContentManagementListPage from '@/pages/ContentManagement/List';
import ContentManagementReadPage from '@/pages/ContentManagement/Read';
import ContentManagementUpdatePage from '@/pages/ContentManagement/Update';
import NotFoundPage from '@/pages/Error/NotFound';
import SignInPage from '@/pages/SignIn';
import TemplateManagementCreatePage from '@/pages/TemplateManagement/Create';
import TemplateManagementReadPage from '@/pages/TemplateManagement/Read';
import TemplateManagementUpdatePage from '@/pages/TemplateManagement/Update';
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
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
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
                          path: ':tenantId',
                          children: [
                            {
                              path: '',
                              Component: TenantManagementReadPage,
                            },
                            {
                              path: 'edit',
                              Component: TenantManagementUpdatePage,
                            },
                          ],
                        },
                      ],
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
                          path: ':contentId',
                          children: [
                            {
                              path: '',
                              Component: ContentManagementReadPage,
                            },
                            {
                              path: 'edit',
                              Component: ContentManagementUpdatePage,
                            },
                            {
                              path: 'create',
                              Component: TemplateManagementCreatePage,
                            },
                            {
                              path: ':templateId',
                              children: [
                                {
                                  path: '',
                                  Component: TemplateManagementReadPage,
                                },
                                {
                                  path: 'edit',
                                  Component: TemplateManagementUpdatePage,
                                },
                              ],
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
              ],
            },
          ])}
        />
      </ApolloProvider>
    </AuthenticationProvider>
  </StrictMode>,
);
