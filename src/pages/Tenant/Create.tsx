import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CREATE_TENANT, CreateTenantResponse, CreateTenantVariables } from '@/graphql/tenant';
import { useMutation } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { tenantNameValidation } from '@/utils/dataGrid';

export default function PagesTenantCreate() {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [createTenant, { loading: isSubmitting }] = useMutation<CreateTenantResponse, CreateTenantVariables>(CREATE_TENANT);

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  };

  const handleClickCancel = () => navigate('/tenant');

  const handleClickCreate = useCallback(async () => {
    try {
      const result = tenantNameValidation.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      const { data } = await createTenant({ variables: { name: result.data.name } });

      notifications.show('테턴트를 생성했습니다.', { severity: 'success', autoHideDuration: 1000 });

      navigate(`/tenant/${data?.createTenant.id}`);
    } catch (error) {
      notifications.show('테넌트 생성 중 오류가 발생했습니다.', { severity: 'error', autoHideDuration: 2000 });

      setError(error instanceof Error ? error.message : '테넌트 생성 중 오류가 발생했습니다.');
    }
  }, [name, createTenant, navigate, notifications]);

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
