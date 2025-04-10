import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { DELETE_TENANTS, DeleteTenantsResponse, DeleteTenantsVariables, GET_TENANTS, TenantsData } from '@/graphql/tenant';
import { useMutation, useQuery } from '@apollo/client';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridRowSelectionModel,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarProps,
  GridToolbarQuickFilter,
  ToolbarPropsOverrides,
} from '@mui/x-data-grid';
import { useNotifications } from '@toolpad/core/useNotifications';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import dayjs from 'dayjs';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    rowSelectionModel: GridRowSelectionModel;
    onClickCreate: () => void;
    onClickDelete: () => void;
  }
}

function CustomToolbar(props: GridToolbarProps & ToolbarPropsOverrides) {
  const { rowSelectionModel, onClickCreate, onClickDelete } = props;

  return (
    <GridToolbarContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: '10px',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: { xs: 'flex-start', lg: 'space-between' },
        }}
      >
        <Stack
          sx={{
            flexDirection: 'row',
            gap: '0 10px',
            width: { xs: '100%', lg: 'auto' },
          }}
        >
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />
          <GridToolbarExport />
          {rowSelectionModel.length > 0 && (
            <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={onClickDelete}>
              선택 항목 삭제 ({rowSelectionModel.length})
            </Button>
          )}
        </Stack>
        <Stack
          sx={{
            flexDirection: 'row',
            gap: '0 20px',
            width: { xs: '100%', lg: 'auto' },
          }}
        >
          <GridToolbarQuickFilter
            size="small"
            placeholder="검색"
            sx={{
              padding: 0,
              flex: 1,
              '& .MuiInput-input': { padding: 0, fontSize: '13px' },
            }}
          />
          <Button variant="contained" size="small" startIcon={<CreateIcon />} onClick={onClickCreate}>
            테넌트 생성
          </Button>
        </Stack>
      </Box>
    </GridToolbarContainer>
  );
}

export default function PagesTenantManagementList() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { loading, data, refetch } = useQuery<TenantsData>(GET_TENANTS);
  const [deleteTenants] = useMutation<DeleteTenantsResponse, DeleteTenantsVariables>(DELETE_TENANTS);

  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 65 },
      { field: 'name', headerName: '이름', flex: 1 },
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

  const styles = useMemo(
    () => ({
      border: 0,
      '& .MuiDataGrid-toolbarContainer': {
        padding: '0',
        marginBottom: '10px',
      },
      '& .MuiDataGrid-columnHeader:focus': {
        outline: 'none',
      },
      '& .MuiDataGrid-columnHeader:focus-within': {
        outline: 'none',
      },
      '& .MuiDataGrid-row': {
        cursor: 'pointer',
      },
      '& .MuiDataGrid-cell:focus': {
        outline: 'none',
      },
      '& .MuiDataGrid-cell:focus-within': {
        outline: 'none',
      },
      '& .MuiDataGrid-row.Mui-selected': {
        margin: 0,
        padding: 0,
        outline: 'none',
        border: 'none',
      },
    }),
    [],
  );

  const localeText = useMemo(
    () => ({
      toolbarColumns: '컬럼',
      toolbarFilters: '필터',
      toolbarDensity: '행 간격',
      toolbarExport: '내보내기',
      noRowsLabel: '데이터가 없습니다.',
      footerRowSelected: (count: number) => `${count}개 선택됨`,
      MuiTablePagination: {
        labelRowsPerPage: '페이지당 행 수:',
      },
    }),
    [],
  );

  const handleRowClick: GridEventListener<'rowClick'> = useCallback(
    ({ row }) => {
      navigate(`/tenant-management/${row.id}`);
    },
    [navigate],
  );

  const handleCloseDialog = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleConfirmDialog = useCallback(async () => {
    setDeleteDialogOpen(false);

    try {
      await deleteTenants({ variables: { ids: rowSelectionModel as string[] } });

      await refetch();

      notifications.show('테넌트를 삭제했습니다.', { severity: 'success', autoHideDuration: 3000 });

      setRowSelectionModel([]);
    } catch (error) {
      console.error(error);
    }
  }, [deleteTenants, refetch, rowSelectionModel]);

  const handleCreateClick = useCallback(() => {
    navigate('/tenant-management/create');
  }, [navigate]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!data?.tenants) {
    return null;
  }

  const { tenants } = data;

  return (
    <>
      <Card sx={{ background: 'none', boxShadow: 'none' }}>
        <CardContent>
          <DataGrid
            loading={loading}
            columns={columns}
            rows={tenants || []}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
              filter: {
                filterModel: {
                  items: [],
                  quickFilterValues: [],
                },
              },
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
            slots={{
              toolbar: CustomToolbar,
            }}
            slotProps={{
              toolbar: {
                rowSelectionModel,
                onClickCreate: handleCreateClick,
                onClickDelete: handleDeleteClick,
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog container={document.getElementById('layers')} open={deleteDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>선택한 {rowSelectionModel.length}개 항목을 삭제하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDialog} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
