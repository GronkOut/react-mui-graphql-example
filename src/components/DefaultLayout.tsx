import { Outlet, useLocation, useParams } from 'react-router';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';

export default function DefaultLayout() {
  const params = useParams();
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  let title = '';
  let breadcrumbs = undefined;

  if (pathSegments[0] === 'tenant') {
    if (pathSegments[1] === 'create') {
      title = '테넌트 생성';
      breadcrumbs = [{ title: '테넌트 관리', path: '/tenant' }, { title: '생성' }];
    } else if (params.tenantId) {
      if (pathSegments[2] === 'edit') {
        title = '테넌트 수정';
        breadcrumbs = [{ title: '테넌트 관리', path: '/tenant' }, { title: params.tenantId, path: `tenant/${params.tenantId}` }, { title: '수정' }];
      } else {
        title = '테넌트 정보';
        breadcrumbs = [{ title: '테넌트 관리', path: '/tenant' }, { title: params.tenantId }];
      }
    } else {
      title = '테넌트 목록';
      breadcrumbs = [{ title: '테넌트 관리' }];
    }
  } else if (pathSegments[0] === 'content') {
    if (pathSegments[1] === 'create') {
      title = '콘텐츠 생성';
      breadcrumbs = [{ title: '콘텐츠 관리', path: '/content' }, { title: '생성' }];
    } else if (params.contentId) {
      if (pathSegments[2] === 'edit') {
        title = '콘텐츠 수정';
        breadcrumbs = [{ title: '콘텐츠 관리', path: '/content' }, { title: params.contentId, path: `/content/${params.contentId}` }, { title: '수정' }];
      } else {
        if (pathSegments[2] === 'create') {
          title = '템플릿 생성';
          breadcrumbs = [{ title: '콘텐츠 관리', path: '/content' }, { title: params.contentId, path: `/content/${params.contentId}` }, { title: '생성' }];
        } else if (params.templateId) {
          if (pathSegments[3] === 'edit') {
            title = '템플릿 수정';
            breadcrumbs = [
              { title: '데이터' },
              { title: '콘텐츠 관리', path: '/content' },
              { title: params.contentId, path: `/content/${params.contentId}` },
              { title: params.templateId, path: `/content/${params.contentId}/${params.templateId}` },
              { title: '수정' },
            ];
          } else {
            title = '템플릿 정보';
            breadcrumbs = [{ title: '콘텐츠 관리', path: '/content' }, { title: params.contentId, path: `/content/${params.contentId}` }, { title: params.templateId }];
          }
        } else {
          title = '콘텐츠 정보';
          breadcrumbs = [{ title: '콘텐츠 관리', path: '/content' }, { title: params.contentId }];
        }
      }
    } else {
      title = '콘텐츠 목록';
      breadcrumbs = [{ title: '콘텐츠 관리' }];
    }
  }

  return (
    <DashboardLayout sidebarExpandedWidth={300}>
      <PageContainer title={title || undefined} breadcrumbs={breadcrumbs} sx={{ margin: '0', maxWidth: 'none !important' }}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
}
