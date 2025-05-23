import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentsData, DELETE_CONTENTS, DeleteContentsResponse, DeleteContentsVariables, GET_CONTENTS } from '@/graphql/content';
import { useMutation, useQuery } from '@apollo/client';
import { Card, CardContent } from '@mui/material';
import { DataGrid, GridColDef, GridEventListener, GridRowSelectionModel } from '@mui/x-data-grid';
import { useNotifications } from '@toolpad/core/useNotifications';
import dayjs from 'dayjs';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Toolbar } from '@/components/DataGridToolbar';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { localeText, styles } from '@/utils/dataGrid';

export default function PagesContentList() {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const navigate = useNavigate();
  const notifications = useNotifications();

  const { loading, data: contentsData, refetch } = useQuery<ContentsData>(GET_CONTENTS);
  const [deleteContents] = useMutation<DeleteContentsResponse, DeleteContentsVariables>(DELETE_CONTENTS);

  const deleteConfirm = useConfirmDialog({
    title: '콘텐츠 삭제',
    content: (
      <>
        선택한 {rowSelectionModel.length}개의 콘텐츠를 삭제하시겠습니까?
        <br />
        포함된 템플릿도 모두 삭제됩니다.
      </>
    ),
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: useCallback(async () => {
      try {
        await deleteContents({ variables: { ids: rowSelectionModel as string[] } });

        await refetch();

        notifications.show('콘텐츠를 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });

        setRowSelectionModel([]);
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '콘텐츠 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [deleteContents, notifications, refetch, rowSelectionModel]),
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 65 },
      { field: 'name', headerName: '이름', flex: 1 },
      {
        field: 'createdAt',
        headerName: '생성일',
        width: 155,
        valueFormatter: ({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        field: 'updatedAt',
        headerName: '수정일',
        width: 155,
        valueFormatter: ({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      },
    ],
    [],
  );

  const handleRowClick: GridEventListener<'rowClick'> = useCallback(({ row }) => navigate(`/content/${row.id}`), [navigate]);

  const handleClickCreate = useCallback(() => navigate('/content/create'), [navigate]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!contentsData?.contents) {
    return null;
  }

  const { contents } = contentsData;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none' }}>
        <CardContent>
          <DataGrid
            loading={loading}
            columns={columns}
            rows={contents}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableColumnMenu
            disableRowSelectionOnClick
            sx={styles}
            onRowClick={handleRowClick}
            onRowSelectionModelChange={(newRowSelectionModel) => setRowSelectionModel(newRowSelectionModel)}
            rowSelectionModel={rowSelectionModel}
            localeText={localeText}
            slots={{ toolbar: Toolbar }}
            slotProps={{
              toolbar: {
                createButtonName: '콘텐츠 생성',
                rowSelectionModel,
                onClickCreate: handleClickCreate,
                onClickDelete: deleteConfirm.handleOpen,
              },
            }}
          />
        </CardContent>
      </Card>
      {deleteConfirm.ConfirmDialog}
    </>
  );
}
