import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CREATE_TEMPLATE, CreateTemplateResponse, CreateTemplateVariables, GET_TEMPLATES_BY_CONTENT_ID, TemplatesByContentIdData } from '@/graphql/template';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { templateNameValidation } from '@/utils/dataGrid';

export default function PagesTemplateCreate() {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  const { contentId } = useParams<{ contentId: string }>();
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { refetch } = useQuery<TemplatesByContentIdData>(GET_TEMPLATES_BY_CONTENT_ID, {
    variables: { contentId: contentId || '' },
    skip: !contentId,
  });
  const [createTemplate, { loading: isSubmitting }] = useMutation<CreateTemplateResponse, CreateTemplateVariables>(CREATE_TEMPLATE);

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  };

  const handleClickCancel = () => navigate(`/content/${contentId}`);

  const handleClickCreate = useCallback(async () => {
    try {
      const result = templateNameValidation.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      const { data } = await createTemplate({
        variables: {
          contentId: contentId as string,
          name: result.data.name,
          data: JSON.stringify([
            {
              id: crypto.randomUUID(),
              key: 'newTemplate',
              orderable: true,
              editable: true,
              fields: [],
              children: [],
            },
          ]),
        },
      });

      await refetch();

      notifications.show('템플릿을 생성했습니다.', { severity: 'success', autoHideDuration: 1000 });

      navigate(`/content/${contentId}/${data?.createTemplate.id}`);
    } catch (error) {
      notifications.show('템플릿 생성 중 오류가 발생했습니다.', { severity: 'error', autoHideDuration: 2000 });

      setError(error instanceof Error ? error.message : '템플릿 생성 중 오류가 발생했습니다.');
    }
  }, [name, createTemplate, refetch, navigate, notifications, contentId]);

  const handleKeyDownName = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !isSubmitting) {
        handleClickCreate();
      }
    },
    [handleClickCreate, isSubmitting],
  );

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <Card sx={{ background: 'none', boxShadow: 'none' }}>
      <CardContent>
        <Stack sx={{ gap: '20px' }}>
          <TextField inputRef={nameRef} label="이름" autoComplete="off" value={name} error={!!error} helperText={error} disabled={isSubmitting} onChange={handleChangeName} onKeyDown={handleKeyDownName} />
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
