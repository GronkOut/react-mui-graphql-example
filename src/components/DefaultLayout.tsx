import { Outlet, useLocation, useParams } from 'react-router';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';

export default function DefaultLayout() {
  const params = useParams();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  let title = '';
  let breadcrumbs = undefined;

  if (pathSegments[0] === 'content-management') {
    if (pathSegments[1] === 'create') {
      title = '컨텐츠 생성';
      breadcrumbs = [
        { title: '컨텐츠 관리', path: 'content-management' },
        { title: '생성', path: 'content-management/create' },
      ];
    } else if (params.id) {
      if (pathSegments[2] === 'edit') {
        title = '컨텐츠 수정';
        breadcrumbs = [
          { title: '컨텐츠 관리', path: 'content-management' },
          { title: params.id, path: `content-management/${params.id}` },
          { title: '수정', path: `content-management/${params.id}/edit` },
        ];
      } else {
        title = '컨텐츠 정보';
        breadcrumbs = [
          { title: '컨텐츠 관리', path: 'content-management' },
          { title: params.id, path: `content-management/${params.id}` },
        ];
      }
    } else {
      title = '컨텐츠 목록';
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
