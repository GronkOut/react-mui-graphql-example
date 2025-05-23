import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthenticationProvider } from '@/contexts/Authentication';
import DefaultLayout from '@/components/DefaultLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ContentCreatePage from '@/pages/Content/Create';
import ContentListPage from '@/pages/Content/List';
import ContentReadPage from '@/pages/Content/Read';
import ContentUpdatePage from '@/pages/Content/Update';
import ForbiddenPage from '@/pages/Error/Forbidden';
import NotFoundPage from '@/pages/Error/NotFound';
import IntroPage from '@/pages/Intro';
import TemplateCreatePage from '@/pages/Template/Create';
import TemplateReadPage from '@/pages/Template/Read';
import TemplateUpdatePage from '@/pages/Template/Update';
import TenantCreatePage from '@/pages/Tenant/Create';
import TenantListPage from '@/pages/Tenant/List';
import TenantReadPage from '@/pages/Tenant/Read';
import TenantUpdatePage from '@/pages/Tenant/Update';
import Application from './Application';

const apolloClient = new ApolloClient({
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('application')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={createBrowserRouter([
            {
              Component: () => (
                <AuthenticationProvider>
                  <Application />
                </AuthenticationProvider>
              ),
              children: [
                {
                  path: 'intro',
                  Component: IntroPage,
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
                      path: 'tenant',
                      children: [
                        {
                          path: '',
                          Component: TenantListPage,
                        },
                        {
                          path: 'create',
                          Component: TenantCreatePage,
                        },
                        {
                          path: ':tenantId',
                          children: [
                            {
                              path: '',
                              Component: TenantReadPage,
                            },
                            {
                              path: 'edit',
                              Component: TenantUpdatePage,
                            },
                          ],
                        },
                      ],
                    },
                    {
                      path: 'content',
                      children: [
                        {
                          path: '',
                          Component: ContentListPage,
                        },
                        {
                          path: 'create',
                          Component: ContentCreatePage,
                        },
                        {
                          path: ':contentId',
                          children: [
                            {
                              path: '',
                              Component: ContentReadPage,
                            },
                            {
                              path: 'edit',
                              Component: ContentUpdatePage,
                            },
                            {
                              path: 'create',
                              Component: TemplateCreatePage,
                            },
                            {
                              path: ':templateId',
                              children: [
                                {
                                  path: '',
                                  Component: TemplateReadPage,
                                },
                                {
                                  path: 'edit',
                                  Component: TemplateUpdatePage,
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
                {
                  path: 'forbidden',
                  Component: ForbiddenPage,
                },
              ],
            },
          ])}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ApolloProvider>
  </StrictMode>,
);
