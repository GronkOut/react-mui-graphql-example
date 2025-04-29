import { Outlet, useLocation, useParams } from 'react-router';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';

export default function DefaultLayout() {
  const params = useParams();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  let title = '';
  let breadcrumbs = undefined;

  if (pathSegments[0] === 'tenant-management') {
    if (pathSegments[1] === 'create') {
      title = '테넌트 생성';
      breadcrumbs = [
        { title: '테넌트 관리', path: 'tenant-management' },
        { title: '생성', path: 'tenant-management/create' },
      ];
    } else if (params.tenantId) {
      if (pathSegments[2] === 'edit') {
        title = '테넌트 수정';
        breadcrumbs = [
          { title: '테넌트 관리', path: 'tenant-management' },
          { title: params.tenantId, path: `tenant-management/${params.tenantId}` },
          { title: '수정', path: `tenant-management/${params.tenantId}/edit` },
        ];
      } else {
        title = '테넌트 정보';
        breadcrumbs = [
          { title: '테넌트 관리', path: 'tenant-management' },
          { title: params.tenantId, path: `tenant-management/${params.tenantId}` },
        ];
      }
    } else {
      title = '테넌트 목록';
    }
  } else if (pathSegments[0] === 'content-management') {
    if (pathSegments[1] === 'create') {
      title = '콘텐츠 생성';
      breadcrumbs = [
        { title: '콘텐츠 관리', path: 'content-management' },
        { title: '생성', path: 'content-management/create' },
      ];
    } else if (params.contentId) {
      if (pathSegments[2] === 'edit') {
        title = '콘텐츠 수정';
        breadcrumbs = [
          { title: '콘텐츠 관리', path: 'content-management' },
          { title: params.contentId, path: `content-management/${params.contentId}` },
          { title: '수정', path: `content-management/${params.contentId}/edit` },
        ];
      } else {
        if (pathSegments[2] === 'create') {
          title = '템플릿 생성';
          breadcrumbs = [
            { title: '콘텐츠 관리', path: 'content-management' },
            { title: params.contentId, path: `content-management/${params.contentId}` },
            { title: '생성', path: `content-management/${params.contentId}/create` },
          ];
        } else if (params.templateId) {
          if (pathSegments[3] === 'edit') {
            title = '템플릿 수정';
            breadcrumbs = [
              { title: '콘텐츠 관리', path: 'content-management' },
              { title: params.contentId, path: `content-management/${params.contentId}` },
              { title: params.templateId, path: `content-management/${params.contentId}/${params.templateId}` },
              { title: '수정', path: `content-management/${params.contentId}/${params.templateId}/edit` },
            ];
          } else {
            title = '템플릿 정보';
            breadcrumbs = [
              { title: '콘텐츠 관리', path: 'content-management' },
              { title: params.contentId, path: `content-management/${params.contentId}` },
              { title: params.templateId, path: `content-management/${params.contentId}/${params.templateId}` },
            ];
          }
        } else {
          title = '콘텐츠 정보';
          breadcrumbs = [
            { title: '콘텐츠 관리', path: 'content-management' },
            { title: params.contentId, path: `content-management/${params.contentId}` },
          ];
        }
      }
    } else {
      title = '콘텐츠 목록';
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
