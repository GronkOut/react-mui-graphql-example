import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentData, ContentsData, DELETE_CONTENTS, DeleteContentsResponse, DeleteContentsVariables, GET_CONTENT, GET_CONTENTS, ReadContentVariables } from '@/graphql/content';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import dayjs from 'dayjs';

export default function PagesContentManagementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { refetch } = useQuery<ContentsData>(GET_CONTENTS);
  const { data, loading } = useQuery<ContentData, ReadContentVariables>(GET_CONTENT, {
    variables: { id: id || '' },
    skip: !id,
  });
  const [deleteContents] = useMutation<DeleteContentsResponse, DeleteContentsVariables>(DELETE_CONTENTS);

  const deleteConfirm = useConfirmDialog({
    onConfirm: async () => {
      try {
        await deleteContents({ variables: { ids: [id as string] } });

        await refetch();

        notifications.show('컨텐츠를 삭제했습니다.', { severity: 'success', autoHideDuration: 3000 });

        navigate('/content-management');
      } catch (error) {
        console.error(error);
      }
    },
  });

  const handleClickBack = useCallback(() => {
    navigate('/content-management');
  }, [navigate]);

  const handleClickEdit = useCallback(() => {
    navigate(`/content-management/${id}/edit`);
  }, [navigate, id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!data?.content) {
    return (
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
        }}
      >
        데이터가 없습니다.
      </Stack>
    );
  }

  const { content } = data;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none' }}>
        <CardContent>
          <Stack spacing={3}>
            <TextField label="이름" value={content.name} slotProps={{ input: { readOnly: true } }} />
            <Stack sx={{ gap: '20px', flexDirection: { xs: 'column', lg: 'row' } }}>
              <TextField label="생성일" value={dayjs(content.createdAt).format('YYYY-MM-DD HH:mm:ss')} slotProps={{ input: { readOnly: true } }} sx={{ flexGrow: 1 }} />
              <TextField label="수정일" value={dayjs(content.updatedAt).format('YYYY-MM-DD HH:mm:ss')} slotProps={{ input: { readOnly: true } }} sx={{ flexGrow: 1 }} />
            </Stack>
          </Stack>
        </CardContent>
        <Divider sx={{ margin: '20px 0' }} />
        <CardActions sx={{ padding: '0 16px' }}>
          <Button variant="outlined" size="small" startIcon={<ListAltIcon />} onClick={handleClickBack}>
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

      <Dialog container={document.getElementById('layers')} open={deleteConfirm.isOpen} onClose={deleteConfirm.handleClose}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>컨텐츠를 삭제하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteConfirm.handleClose} color="primary">
            취소
          </Button>
          <Button onClick={deleteConfirm.handleConfirm} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
