import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentsData, GET_CONTENTS } from '@/graphql/content';
import { GET_TEMPLATES, TemplatesData } from '@/graphql/template';
import { DELETE_TENANTS, DeleteTenantsResponse, DeleteTenantsVariables, GET_TENANT, ReadTenantVariables, TenantData } from '@/graphql/tenant';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Button, Card, CardActions, CardContent, Divider, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import dayjs from 'dayjs';

export default function PagesTenantManagementRead() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { data: tenantData, loading: tenantLoading } = useQuery<TenantData, ReadTenantVariables>(GET_TENANT, {
    variables: { id: tenantId || '' },
    skip: !tenantId,
  });
  const { data: contentsData, loading: contentsLoading } = useQuery<ContentsData>(GET_CONTENTS);
  const { data: templatesData, loading: templatesLoading } = useQuery<TemplatesData>(GET_TEMPLATES);
  const [deleteTenants] = useMutation<DeleteTenantsResponse, DeleteTenantsVariables>(DELETE_TENANTS);

  const deleteConfirm = useConfirmDialog({
    title: '테넌트 삭제',
    content: '테넌트를 삭제하시겠습니까?',
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: async () => {
      try {
        await deleteTenants({ variables: { ids: [tenantId as string] } });

        notifications.show('테넌트를 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        navigate('/tenant-management');
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '테넌트 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    },
  });

  const handleClickList = useCallback(() => navigate('/tenant-management'), [navigate]);

  const handleClickEdit = useCallback(() => navigate(`/tenant-management/${tenantId}/edit`), [navigate, tenantId]);

  if (tenantLoading || contentsLoading || templatesLoading) {
    return <LoadingIndicator />;
  }

  if (!tenantData?.tenant || !contentsData?.contents || !templatesData?.templates) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

  const { tenant } = tenantData;
  const { contents } = contentsData;
  const { templates } = templatesData;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none' }}>
        <CardContent>
          <Stack sx={{ gap: '20px' }}>
            <TextField label="이름" value={tenant.name} autoComplete="off" disabled />
            <Stack sx={{ gap: '20px', flexDirection: { xs: 'column', lg: 'row' } }}>
              <TextField label="생성일" value={dayjs(tenant.createdAt).format('YYYY-MM-DD HH:mm:ss')} autoComplete="off" disabled sx={{ flexGrow: 1 }} />
              <TextField label="수정일" value={dayjs(tenant.updatedAt).format('YYYY-MM-DD HH:mm:ss')} autoComplete="off" disabled sx={{ flexGrow: 1 }} />
            </Stack>

            {/* 콘텐츠 목록 */}
            {contents.map((content) => {
              const templateMapping = tenant.templateMappings?.find((mapping) => mapping.contentId === content.id);
              const selectedTemplateId = templateMapping?.templateId || '';
              const contentTemplates = templates.filter((template) => template.contentId === content.id);

              return (
                <FormControl key={content.id} fullWidth variant="outlined" disabled>
                  <InputLabel id={`content-label-${content.id}`}>{content.name}</InputLabel>
                  <Select labelId={`content-label-${content.id}`} label={content.name} value={selectedTemplateId}>
                    {contentTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })}
          </Stack>
        </CardContent>
        <Divider sx={{ margin: '20px 0' }} />
        <CardActions sx={{ padding: '0 16px' }}>
          <Button variant="outlined" size="small" startIcon={<ListAltIcon />} onClick={handleClickList}>
            목록
          </Button>
          <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={deleteConfirm.handleOpen}>
            삭제
          </Button>
          <Button variant="contained" size="small" startIcon={<EditDocumentIcon />} onClick={handleClickEdit}>
            수정
          </Button>
        </CardActions>
      </Card>

      {/* 테넌트 삭제 다이얼로그 */}
      {deleteConfirm.ConfirmDialog}
    </>
  );
}
