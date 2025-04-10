import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GET_TENANT, ReadTenantVariables, TenantData, UPDATE_TENANT, UpdateTenantResponse, UpdateTenantVariables } from '@/graphql/tenant';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { z } from 'zod';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function PagesTenantManagementEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tenantFormSchema = z.object({
    name: z.string().min(1, { message: '이름을 입력해주세요.' }).trim(),
  });

  const { data, loading } = useQuery<TenantData, ReadTenantVariables>(GET_TENANT, {
    variables: { id: id || '' },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  const [updateTenant, { loading: isSubmitting }] = useMutation<UpdateTenantResponse, UpdateTenantVariables>(UPDATE_TENANT, {
    onCompleted: () => {
      navigate(`/tenant-management/${id}`);
    },
  });

  const handleChangeName = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  }, []);

  const handleClickCancel = useCallback(() => {
    navigate(`/tenant-management/${id}`);
  }, [navigate, id]);

  const handleClickSave = useCallback(async () => {
    try {
      const result = tenantFormSchema.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      await updateTenant({ variables: { id: id || '', name: result.data.name } });

      notifications.show('테넌트를 수정했습니다.', { severity: 'success', autoHideDuration: 3000 });
    } catch (error) {
      console.error(error);

      setError('테넌트 수정 중 오류가 발생했습니다.');
    }
  }, [tenantFormSchema, name, updateTenant, id, notifications]);

  useEffect(() => {
    if (data?.tenant) {
      setName(data.tenant.name);
    }
  }, [data]);

  useEffect(() => {
    if (nameRef.current && !loading && data?.tenant) {
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
