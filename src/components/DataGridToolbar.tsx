import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Stack } from '@mui/material';
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton, GridToolbarProps, GridToolbarQuickFilter, ToolbarPropsOverrides } from '@mui/x-data-grid';

export function Toolbar(props: GridToolbarProps & ToolbarPropsOverrides) {
  const { createButtonName, rowSelectionModel, onClickCreate, onClickDelete } = props;

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
          <Button variant="contained" size="small" disableElevation startIcon={<CreateIcon />} onClick={onClickCreate}>
            {createButtonName}
          </Button>
        </Stack>
      </Box>
    </GridToolbarContainer>
  );
}
