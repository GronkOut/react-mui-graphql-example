import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GET_TEMPLATE, ReadTemplateVariables, TemplateData, UPDATE_TEMPLATE, UpdateTemplateResponse, UpdateTemplateVariables } from '@/graphql/template';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { templateNameValidation } from '@/utils/dataGrid';

export default function PagesTemplateUpdate() {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  const { contentId, templateId } = useParams<{ contentId: string; templateId: string }>();
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { data: templateData, loading } = useQuery<TemplateData, ReadTemplateVariables>(GET_TEMPLATE, {
    variables: { id: templateId || '' },
    skip: !templateId,
  });
  const [updateTemplate, { loading: isSubmitting }] = useMutation<UpdateTemplateResponse, UpdateTemplateVariables>(UPDATE_TEMPLATE, {
    onCompleted: () => {
      navigate(`/content/${contentId}/${templateId}`);
    },
  });

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  };

  const handleClickCancel = () => navigate(`/content/${contentId}/${templateId}`);

  const handleClickSave = useCallback(async () => {
    try {
      const result = templateNameValidation.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      await updateTemplate({ variables: { id: templateId as string, name: result.data.name } });

      notifications.show('템플릿을 수정했습니다.', { severity: 'success', autoHideDuration: 1000 });
    } catch (error) {
      notifications.show('템플릿 수정 중 오류가 발생했습니다.', { severity: 'error', autoHideDuration: 2000 });

      setError(error instanceof Error ? error.message : '템플릿 수정 중 오류가 발생했습니다.');
    }
  }, [name, updateTemplate, templateId, notifications]);

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSubmitting) {
      handleClickSave();
    }
  };

  useEffect(() => {
    if (templateData?.template) {
      setName(templateData.template.name);
    }
  }, [templateData]);

  useEffect(() => {
    if (nameRef.current && !loading && templateData?.template) {
      nameRef.current.focus();
    }
  }, [templateData, loading]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!templateData?.template) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

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
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleClickSave} disabled={isSubmitting}>
          저장
        </Button>
      </CardActions>
    </Card>
  );
}
