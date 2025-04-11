import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CREATE_CONTENT, ContentsData, CreateContentResponse, CreateContentVariables, GET_CONTENTS } from '@/graphql/content';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { z } from 'zod';

export default function PagesContentManagementCreate() {
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);

  const { refetch } = useQuery<ContentsData>(GET_CONTENTS);
  const [createContent, { loading: isSubmitting }] = useMutation<CreateContentResponse, CreateContentVariables>(CREATE_CONTENT);

  const notifications = useNotifications();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const contentFormSchema = z.object({
    name: z.string().min(1, { message: '이름을 입력해주세요.' }).trim(),
  });

  const handleChangeName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  }, []);

  const handleClickCancel = useCallback(() => {
    navigate('/content-management');
  }, [navigate]);

  const handleClickCreate = useCallback(async () => {
    try {
      const result = contentFormSchema.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      const { data } = await createContent({ variables: { name: result.data.name } });

      await refetch();

      notifications.show('테턴트를 생성했습니다.', { severity: 'success', autoHideDuration: 3000 });

      navigate(`/content-management/${data?.createContent.id}`);
    } catch (error) {
      console.error(error);

      setError('컨텐츠 생성 중 오류가 발생했습니다.');
    }
  }, [contentFormSchema, name, createContent, refetch, navigate]);

  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  return (
    <Card sx={{ background: 'none', boxShadow: 'none' }}>
      <CardContent>
        <Stack spacing={5}>
          <TextField inputRef={nameRef} label="이름" value={name} error={!!error} helperText={error} disabled={isSubmitting} autoComplete="off" onChange={handleChangeName} />
        </Stack>
      </CardContent>
      <Divider sx={{ margin: '20px 0' }} />
      <CardActions sx={{ padding: '0 16px' }}>
        <Button variant="outlined" size="small" startIcon={<CancelIcon />} onClick={handleClickCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleClickCreate} disabled={isSubmitting}>
          저장
        </Button>
      </CardActions>
    </Card>
  );
}
