import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentsData, GET_CONTENTS } from '@/graphql/content';
import { GET_TEMPLATES, TemplatesData } from '@/graphql/template';
import { GET_TENANT, ReadTenantVariables, TenantData, UPDATE_TENANT, UpdateTenantResponse, UpdateTenantVariables } from '@/graphql/tenant';
import { useMutation, useQuery } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Card, CardActions, CardContent, Divider, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { tenantNameValidation } from '@/utils/dataGrid';

interface TenantTemplateMappingState {
  contentId: string;
  templateId: string | null;
}

export default function PagesTenantUpdate() {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [templateMappings, setTemplateMappings] = useState<TenantTemplateMappingState[]>([]);

  const { tenantId } = useParams<{ tenantId: string }>();
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { data: tenantData, loading: tenantLoading } = useQuery<TenantData, ReadTenantVariables>(GET_TENANT, {
    variables: { id: tenantId || '' },
    skip: !tenantId,
  });
  const { data: contentsData, loading: contentsLoading } = useQuery<ContentsData>(GET_CONTENTS);
  const { data: templatesData, loading: templatesLoading } = useQuery<TemplatesData>(GET_TEMPLATES);
  const [updateTenant, { loading: isSubmitting }] = useMutation<UpdateTenantResponse, UpdateTenantVariables>(UPDATE_TENANT, {
    onCompleted: () => {
      navigate(`/tenant/${tenantId}`);
    },
  });

  const handleChangeName = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  };

  const handleChangeTemplate = useCallback(
    (contentId: string) => (event: SelectChangeEvent<string>) => {
      const selectedTemplateId = event.target.value;

      setTemplateMappings((prev) => {
        const existingIndex = prev.findIndex((mapping) => mapping.contentId === contentId);
        const newTemplateId = selectedTemplateId === '' ? null : selectedTemplateId;

        if (existingIndex !== -1) {
          const newMappings = [...prev];

          newMappings[existingIndex] = { contentId, templateId: newTemplateId };

          return newMappings;
        } else {
          return [...prev, { contentId, templateId: newTemplateId }];
        }
      });
    },
    [],
  );

  const handleClickCancel = () => navigate(`/tenant/${tenantId}`);

  const handleClickSave = useCallback(async () => {
    try {
      const result = tenantNameValidation.safeParse({ name });

      if (!result.success) {
        const formattedErrors = result.error.format();

        setError(formattedErrors.name?._errors[0] || '유효하지 않은 입력입니다.');

        return;
      }

      setError(null);

      await updateTenant({ variables: { id: tenantId as string, name: result.data.name, mappings: templateMappings } });

      notifications.show('테넌트를 수정했습니다.', { severity: 'success', autoHideDuration: 1000 });
    } catch (error) {
      notifications.show('테넌트 수정 중 오류가 발생했습니다.', { severity: 'error', autoHideDuration: 2000 });

      setError(error instanceof Error ? error.message : '테넌트 수정 중 오류가 발생했습니다.');
    }
  }, [name, updateTenant, tenantId, templateMappings, notifications]);

  const handleKeyDownName = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSubmitting) {
      handleClickSave();
    }
  };

  useEffect(() => {
    if (tenantData?.tenant) {
      setName(tenantData.tenant.name);

      if (tenantData.tenant.templateMappings) {
        setTemplateMappings(
          tenantData.tenant.templateMappings.map((mapping) => ({
            contentId: mapping.contentId,
            templateId: mapping.templateId,
          })),
        );
      } else {
        setTemplateMappings([]);
      }
    }
  }, [tenantData]);

  useEffect(() => {
    if (!tenantLoading && !contentsLoading && !templatesLoading && tenantData?.tenant && contentsData?.contents && templatesData?.templates && nameRef.current) {
      nameRef.current.focus();
    }
  }, [tenantLoading, contentsLoading, templatesLoading, tenantData, contentsData, templatesData, nameRef]);

  if (tenantLoading || contentsLoading || templatesLoading) {
    return <LoadingIndicator />;
  }

  if (!tenantData?.tenant || !contentsData?.contents || !templatesData?.templates) {
    return <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '400px' }}>데이터가 없습니다.</Stack>;
  }

  const { contents } = contentsData;
  const { templates } = templatesData;

  return (
    <Card sx={{ background: 'none', boxShadow: 'none' }}>
      <CardContent>
        <Stack sx={{ gap: '20px' }}>
          <TextField inputRef={nameRef} label="이름" autoComplete="off" value={name} error={!!error} helperText={error} disabled={isSubmitting} onChange={handleChangeName} onKeyDown={handleKeyDownName} />
          {contents.map((content) => {
            const templateMapping = templateMappings.find((mapping) => mapping.contentId === content.id);
            const selectedTemplateId = templateMapping?.templateId || '';
            const contentTemplates = templates.filter((template) => template.contentId === content.id);

            return (
              <FormControl key={content.id} fullWidth variant="outlined" disabled={isSubmitting}>
                <InputLabel id={`content-label-${content.id}`}>{content.name}</InputLabel>
                <Select labelId={`content-label-${content.id}`} label={content.name} value={selectedTemplateId} onChange={handleChangeTemplate(content.id)}>
                  {contentTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}
        </Stack>
      </CardContent>
      <Divider sx={{ margin: '20px 0' }} />
      <CardActions sx={{ padding: '0 16px' }}>
        <Button variant="outlined" size="small" startIcon={<CancelIcon />} onClick={handleClickCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleClickSave} disabled={isSubmitting || !!error}>
          저장
        </Button>
      </CardActions>
    </Card>
  );
}
