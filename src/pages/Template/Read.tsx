import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  DELETE_TEMPLATES,
  DUPLICATE_TEMPLATE,
  DeleteTemplatesResponse,
  DeleteTemplatesVariables,
  DuplicateTemplateResponse,
  DuplicateTemplateVariables,
  GET_TEMPLATE,
  ReadTemplateVariables,
  TemplateData,
  UPDATE_TEMPLATE,
  UpdateTemplateResponse,
  UpdateTemplateVariables,
} from '@/graphql/template';
import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import dayjs from 'dayjs';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { Node } from '@/types/treeView';
import { DataManagement } from '@/components/DataManagement';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { removeTypename } from '@/utils/dataManagement';

export default function PagesTemplateRead() {
  const [showDataManagement, setShowDataManagement] = useState(false);

  const { contentId, templateId } = useParams<{ contentId: string; templateId: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const {
    data: templateData,
    loading,
    refetch: refetchTemplate,
  } = useQuery<TemplateData, ReadTemplateVariables>(GET_TEMPLATE, {
    variables: { id: templateId || '' },
    skip: !templateId,
  });
  const [updateTemplate] = useMutation<UpdateTemplateResponse, UpdateTemplateVariables>(UPDATE_TEMPLATE);
  const [duplicateTemplate] = useMutation<DuplicateTemplateResponse, DuplicateTemplateVariables>(DUPLICATE_TEMPLATE);
  const [deleteTemplates] = useMutation<DeleteTemplatesResponse, DeleteTemplatesVariables>(DELETE_TEMPLATES);

  const deleteConfirm = useConfirmDialog({
    title: '템플릿 삭제',
    content: '템플릿을 삭제하시겠습니까?',
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: useCallback(async () => {
      try {
        await deleteTemplates({ variables: { ids: [templateId as string] } });

        notifications.show('템플릿을 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        navigate(`/content/${contentId}`);
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '템플릿 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [contentId, deleteTemplates, navigate, notifications, templateId]),
  });

  const handleClickList = () => navigate(`/content/${contentId}`);

  const handleClickDuplicate = async () => {
    try {
      const { data } = await duplicateTemplate({ variables: { id: templateId as string } });

      notifications.show('템플릿을 복제했습니다.', { severity: 'success', autoHideDuration: 1000 });

      navigate(`/content/${contentId}/${data?.duplicateTemplate.id}`);
    } catch (error) {
      notifications.show(error instanceof Error ? error.message : '템플릿 복제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
    }
  };

  const handleClickEdit = () => navigate(`/content/${contentId}/${templateId}/edit`);

  const handleSaveDataManagement = useCallback(
    async (dataToSave: Node[]) => {
      if (!templateId) return;

      try {
        const dataToSaveString = JSON.stringify(removeTypename(dataToSave));

        await updateTemplate({ variables: { id: templateId, name: templateData?.template?.name ?? '', data: dataToSaveString } });

        notifications.show('데이터를 저장했습니다.', { severity: 'success', autoHideDuration: 1000 });

        setShowDataManagement(false);

        await refetchTemplate();
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '데이터 저장에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });

        throw error;
      }
    },
    [templateId, updateTemplate, templateData?.template?.name, notifications, refetchTemplate],
  );

  if (loading && !templateData) {
    return <LoadingIndicator />;
  }

  if (!templateData?.template) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

  const { template } = templateData;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none', marginBottom: '100px' }}>
        <CardContent>
          <Stack sx={{ gap: '20px' }}>
            <TextField label="이름" autoComplete="off" value={template?.name ?? ''} disabled />
            <Stack sx={{ gap: '20px', flexDirection: { xs: 'column', lg: 'row' } }}>
              <TextField label="생성일" autoComplete="off" value={template?.createdAt ? dayjs(template.createdAt).format('YYYY-MM-DD HH:mm:ss') : ''} disabled sx={{ flexGrow: 1 }} />
              <TextField label="수정일" autoComplete="off" value={template?.updatedAt ? dayjs(template.updatedAt).format('YYYY-MM-DD HH:mm:ss') : ''} disabled sx={{ flexGrow: 1 }} />
            </Stack>
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
          <Button variant="outlined" color="secondary" size="small" startIcon={<FileCopyIcon />} onClick={handleClickDuplicate}>
            복제
          </Button>
          <Button variant="contained" size="small" startIcon={<EditDocumentIcon />} onClick={handleClickEdit}>
            수정
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="contained" color="success" size="small" startIcon={<EditDocumentIcon />} onClick={() => setShowDataManagement(true)}>
            데이터 관리
          </Button>
        </CardActions>
      </Card>
      {deleteConfirm.ConfirmDialog}
      {template && <DataManagement open={showDataManagement} onClose={() => setShowDataManagement(false)} onSave={handleSaveDataManagement} templateName={template.name ?? ''} initialDataString={template.data} />}
    </>
  );
}
