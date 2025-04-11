import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentData, GET_CONTENT, ReadContentVariables, UPDATE_CONTENT, UpdateContentResponse, UpdateContentVariables } from '@/graphql/content';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { z } from 'zod';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function PagesContentManagementEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const contentFormSchema = z.object({
    name: z.string().min(1, { message: '이름을 입력해주세요.' }).trim(),
  });

  const { data, loading } = useQuery<ContentData, ReadContentVariables>(GET_CONTENT, {
    variables: { id: id || '' },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  const [updateContent, { loading: isSubmitting }] = useMutation<UpdateContentResponse, UpdateContentVariables>(UPDATE_CONTENT, {
    onCompleted: () => {
      navigate(`/content-management/${id}`);
    },
  });

  const handleChangeName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  }, []);

  const handleClickCancel = useCallback(() => {
    navigate(`/content-management/${id}`);
  }, [navigate, id]);

  const handleClickSave = useCallback(async () => {
    try {
      const result = contentFormSchema.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      await updateContent({ variables: { id: id || '', name: result.data.name } });

      notifications.show('컨텐츠를 수정했습니다.', { severity: 'success', autoHideDuration: 3000 });
    } catch (error) {
      console.error(error);

      setError('컨텐츠 수정 중 오류가 발생했습니다.');
    }
  }, [contentFormSchema, name, updateContent, id, notifications]);

  useEffect(() => {
    if (data?.content) {
      setName(data.content.name);
    }
  }, [data]);

  useEffect(() => {
    if (nameRef.current && !loading && data?.content) {
      nameRef.current.focus();
    }
  }, [data, loading]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Card sx={{ background: 'none', boxShadow: 'none' }}>
      <CardContent>
        <Stack spacing={3}>
          <TextField inputRef={nameRef} label="이름" value={name} onChange={handleChangeName} error={!!error} helperText={error} disabled={isSubmitting} />
        </Stack>
      </CardContent>
      <Divider sx={{ margin: '20px 0' }} />
      <CardActions sx={{ padding: '0 16px' }}>
        <Button variant="outlined" size="small" startIcon={<CancelIcon />} onClick={handleClickCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleClickSave} disabled={isSubmitting}>
          저장
        </Button>
      </CardActions>
    </Card>
  );
}
