import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentData, DELETE_CONTENTS, DeleteContentsResponse, DeleteContentsVariables, GET_CONTENT, ReadContentVariables } from '@/graphql/content';
import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import dayjs from 'dayjs';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import TemplateList from '@/pages/Template/List';

export default function PagesContentRead() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { data: contentData, loading } = useQuery<ContentData, ReadContentVariables>(GET_CONTENT, {
    variables: { id: contentId || '' },
    skip: !contentId,
  });
  const [deleteContents] = useMutation<DeleteContentsResponse, DeleteContentsVariables>(DELETE_CONTENTS);

  const deleteConfirm = useConfirmDialog({
    title: '콘텐츠 삭제',
    content: (
      <>
        콘텐츠를 삭제하시겠습니까?
        <br />
        포함된 템플릿도 모두 삭제됩니다.
      </>
    ),
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: useCallback(async () => {
      try {
        await deleteContents({ variables: { ids: [contentId as string] } });

        notifications.show('콘텐츠를 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        navigate('/content');
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '콘텐츠 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [contentId, deleteContents, navigate, notifications]),
  });

  const handleClickList = () => navigate('/content');

  const handleClickEdit = () => navigate(`/content/${contentId}/edit`);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!contentData?.content) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

  const { content } = contentData;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none', marginBottom: '100px' }}>
        <CardContent>
          <Stack sx={{ gap: '20px' }}>
            <TextField label="이름" autoComplete="off" value={content.name} disabled />
            <Stack sx={{ gap: '20px', flexDirection: { xs: 'column', lg: 'row' } }}>
              <TextField label="생성일" autoComplete="off" value={dayjs(content.createdAt).format('YYYY-MM-DD HH:mm:ss')} disabled sx={{ flexGrow: 1 }} />
              <TextField label="수정일" autoComplete="off" value={dayjs(content.updatedAt).format('YYYY-MM-DD HH:mm:ss')} disabled sx={{ flexGrow: 1 }} />
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
        </CardActions>
      </Card>
      <Typography variant="h5">템플릿 목록</Typography>
      <TemplateList />
      {deleteConfirm.ConfirmDialog}
    </>
  );
}
