import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DELETE_TEMPLATES, DeleteTemplatesResponse, DeleteTemplatesVariables, GET_TEMPLATES_BY_CONTENT_ID, TemplatesByContentIdData } from '@/graphql/template';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useMutation, useQuery } from '@apollo/client';
import { Card, CardContent } from '@mui/material';
import { DataGrid, GridColDef, GridEventListener, GridRowSelectionModel } from '@mui/x-data-grid';
import { useNotifications } from '@toolpad/core/useNotifications';
import { Toolbar } from '@/components/DataGridToolbar';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { localeText, styles } from '@/utils/dataGrid';
import dayjs from 'dayjs';

export default function PagesTemplateManagementList() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { loading, data, refetch } = useQuery<TemplatesByContentIdData>(GET_TEMPLATES_BY_CONTENT_ID, {
    variables: { contentId: contentId || '' },
    skip: !contentId,
  });
  const [deleteTemplates] = useMutation<DeleteTemplatesResponse, DeleteTemplatesVariables>(DELETE_TEMPLATES);

  const deleteConfirm = useConfirmDialog({
    title: '템플릿 삭제',
    content: `선택한 ${rowSelectionModel.length}개의 템플릿을 삭제하시겠습니까?`,
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: async () => {
      try {
        await deleteTemplates({ variables: { ids: rowSelectionModel as string[] } });

        await refetch();

        notifications.show('템플릿을 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        setRowSelectionModel([]);
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '템플릿 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    },
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 65 },
      { field: 'name', headerName: '이름', flex: 1 },
      { field: 'tenantCount', headerName: '사용', width: 80 },
      {
        field: 'createdAt',
        headerName: '생성일',
        width: 155,
        valueGetter: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        field: 'updatedAt',
        headerName: '수정일',
        width: 155,
        valueGetter: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      },
    ],
    [],
  );

  const handleRowClick: GridEventListener<'rowClick'> = useCallback(
    ({ row }) => {
      navigate(`/content-management/${contentId}/${row.id}`);
    },
    [navigate, contentId],
  );

  const handleClickCreate = useCallback(() => {
    navigate(`/content-management/${contentId}/create`);
  }, [navigate, contentId]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!data?.templatesByContentId) {
    return null;
  }

  const { templatesByContentId: templates } = data;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none' }}>
        <CardContent>
          <DataGrid
            loading={loading}
            columns={columns}
            rows={templates || []}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
            }}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableColumnMenu
            disableRowSelectionOnClick
            sx={styles}
            onRowClick={handleRowClick}
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setRowSelectionModel(newRowSelectionModel);
            }}
            rowSelectionModel={rowSelectionModel}
            localeText={localeText}
            slots={{ toolbar: Toolbar }}
            slotProps={{
              toolbar: {
                createButtonName: '템플릿 생성',
                rowSelectionModel,
                onClickCreate: handleClickCreate,
                onClickDelete: deleteConfirm.handleOpen,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* 템플릿 삭제 다이얼로그 */}
      {deleteConfirm.ConfirmDialog}
    </>
  );
}
