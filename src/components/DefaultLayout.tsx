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
    } else if (params.id) {
      if (pathSegments[2] === 'edit') {
        title = '테넌트 수정';
        breadcrumbs = [
          { title: '테넌트 관리', path: 'tenant-management' },
          { title: params.id, path: `tenant-management/${params.id}` },
          { title: '수정', path: `tenant-management/${params.id}/edit` },
        ];
      } else {
        title = '테넌트 정보';
        breadcrumbs = [
          { title: '테넌트 관리', path: 'tenant-management' },
          { title: params.id, path: `tenant-management/${params.id}` },
        ];
      }
    } else {
      title = '테넌트 목록';
    }
  }

  return (
    <DashboardLayout>
      <PageContainer title={title || undefined} breadcrumbs={breadcrumbs}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
}
