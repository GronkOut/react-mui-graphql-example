import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DELETE_TEMPLATES, DeleteTemplatesResponse, DeleteTemplatesVariables, GET_TEMPLATE, ReadTemplateVariables, TemplateData, UPDATE_TEMPLATE, UpdateTemplateResponse, UpdateTemplateVariables } from '@/graphql/template';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { TreeViewItem } from '@/types/treeView';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SaveIcon from '@mui/icons-material/Save';
import { AppBar, Box, Button, Card, CardActions, CardContent, Dialog, Divider, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import TreeView from '@/components/TreeView';
import dayjs from 'dayjs';

function parseTemplateData(dataString: string | null | undefined): TreeViewItem[] {
  if (!dataString) return [];

  try {
    const parsedData = JSON.parse(dataString);

    if (Array.isArray(parsedData)) {
      return parsedData as TreeViewItem[];
    } else {
      console.error('Parsed data is not an array:', parsedData);

      return [];
    }
  } catch (error) {
    console.error('Failed to parse template data JSON:', error);

    return [];
  }
}

function removeTypename<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(removeTypename) as T;

  if (obj && typeof obj === 'object') {
    const result = {} as Record<string, unknown>;

    for (const key in obj) {
      if (key !== '__typename') {
        const typedObj = obj as Record<string, unknown>;

        result[key] = removeTypename(typedObj[key]);
      }
    }

    return result as T;
  }

  return obj;
}

export default function PagesTemplateManagementRead() {
  const [showDataManagementDialog, setShowDataManagementDialog] = useState(false);
  const [originalTreeData, setOriginalTreeData] = useState<TreeViewItem[]>([]);
  const [treeData, setTreeData] = useState<TreeViewItem[]>([]);
  const [hasErrors, setHasErrors] = useState(false);

  const { contentId, templateId } = useParams<{ contentId: string; templateId: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { data, loading } = useQuery<TemplateData, ReadTemplateVariables>(GET_TEMPLATE, {
    variables: { id: templateId || '' },
    skip: !templateId,
  });
  const [updateTemplate] = useMutation<UpdateTemplateResponse, UpdateTemplateVariables>(UPDATE_TEMPLATE);
  const [deleteTemplates] = useMutation<DeleteTemplatesResponse, DeleteTemplatesVariables>(DELETE_TEMPLATES);

  const deleteConfirm = useConfirmDialog({
    title: '템플릿 삭제',
    content: '템플릿을 삭제하시겠습니까?',
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: async () => {
      try {
        await deleteTemplates({ variables: { ids: [templateId as string] } });

        notifications.show('템플릿을 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        navigate(`/content-management/${contentId}`);
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '템플릿 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    },
  });

  const template = data?.template;
  const parsedTemplateData = useMemo(() => parseTemplateData(template?.data), [template?.data]);

  const handleClickList = useCallback(() => {
    navigate(`/content-management/${contentId}`);
  }, [navigate, contentId]);

  const handleClickEdit = useCallback(() => {
    navigate(`/content-management/${contentId}/${templateId}/edit`);
  }, [navigate, contentId, templateId]);

  const handleClickSave = async () => {
    if (!templateId) return;

    try {
      const dataToSave = JSON.stringify(removeTypename(treeData));

      await updateTemplate({ variables: { id: templateId as string, name: data?.template?.name ?? '', data: dataToSave } });

      notifications.show('데이터를 저장했습니다.', { severity: 'success', autoHideDuration: 1000 });

      setShowDataManagementDialog(false);
    } catch (error) {
      notifications.show(error instanceof Error ? error.message : '데이터 저장에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
    }
  };

  const handleClickCancel = () => {
    setTreeData(originalTreeData);

    setShowDataManagementDialog(false);
  };

  useEffect(() => {
    const parsedData = parseTemplateData(template?.data);

    setTreeData(parsedData);
  }, [template]);

  useEffect(() => {
    if (showDataManagementDialog) {
      setOriginalTreeData(parsedTemplateData);
      setTreeData(parsedTemplateData);
    }
  }, [showDataManagementDialog, parsedTemplateData]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!data?.template) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none', marginBottom: '100px' }}>
        <CardContent>
          <Stack sx={{ gap: '20px' }}>
            <TextField label="이름" value={template?.name} autoComplete="off" disabled />
            <Stack sx={{ gap: '20px', flexDirection: { xs: 'column', lg: 'row' } }}>
              <TextField label="생성일" value={dayjs(template?.createdAt).format('YYYY-MM-DD HH:mm:ss')} autoComplete="off" disabled sx={{ flexGrow: 1 }} />
              <TextField label="수정일" value={dayjs(template?.updatedAt).format('YYYY-MM-DD HH:mm:ss')} autoComplete="off" disabled sx={{ flexGrow: 1 }} />
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
          <Button variant="contained" size="small" startIcon={<EditDocumentIcon />} onClick={handleClickEdit}>
            수정
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="contained" color="success" size="small" startIcon={<EditDocumentIcon />} onClick={() => setShowDataManagementDialog(true)}>
            데이터 관리
          </Button>
        </CardActions>
      </Card>

      {/* 템플릿 삭제 다이얼로그 */}
      {deleteConfirm.ConfirmDialog}

      {/* 데이터 관리 다이얼로그 */}
      <Dialog container={document.getElementById('layers')} fullScreen open={showDataManagementDialog} onClose={() => setShowDataManagementDialog(false)}>
        <AppBar sx={{ position: 'relative', boxShadow: 'none', borderBottom: 'solid 1px var(--mui-palette-divider)', backgroundColor: 'var(--mui-palette-background-default)' }}>
          <Toolbar sx={{ gap: '10px' }}>
            <Typography sx={{ flex: 1, color: 'var(--mui-palette-primary-main)' }} variant="h6" component="div">
              [{template?.name}] 데이터 관리
            </Typography>
            <Button variant="outlined" disableElevation startIcon={<CancelIcon />} onClick={handleClickCancel}>
              취소
            </Button>
            <Button variant="contained" disableElevation startIcon={<SaveIcon />} disabled={hasErrors} onClick={handleClickSave}>
              저장
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ overflow: { xs: 'auto', lg: 'hidden' }, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, height: 'calc(100% - 64px)' }}>
          <TreeView data={treeData} onDataChange={setTreeData} onErrorsChange={(hasErrors) => setHasErrors(hasErrors)} />
        </Box>
      </Dialog>
    </>
  );
}
