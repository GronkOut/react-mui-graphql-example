import { z } from 'zod';

// 테이블 목록 스타일
export const styles = {
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
};

// 테이블 로케일 텍스트
export const localeText = {
  toolbarColumns: '컬럼',
  toolbarFilters: '필터',
  toolbarDensity: '행 간격',
  toolbarExport: '내보내기',
  noRowsLabel: '데이터가 없습니다.',
  footerRowSelected: (count: number) => `${count}개 선택됨`,
  MuiTablePagination: {
    labelRowsPerPage: '페이지당 행 수:',
  },
};

// 테넌트 이름 입력 유효성 검사
export const tenantNameValidation = z.object({
  name: z
    .string()
    .min(1, { message: '이름을 입력해주세요.' })
    .max(50, { message: '이름은 50자 이내로 입력해주세요.' })
    .trim()
    .regex(/^[가-힣a-zA-Z0-9\s!@#$%^&*_+=\-~{}\\|()]+$/, {
      message: '한글, 영문, 숫자, 공백, 일부 특수문자(!@#$%^&*_+=\\-~{}|())만 허용합니다.',
    }),
});

// 콘텐츠 이름 입력 유효성 검사
export const contentNameValidation = z.object({
  name: z
    .string()
    .min(1, { message: '이름을 입력해주세요.' })
    .max(50, { message: '이름은 50자 이내로 입력해주세요.' })
    .trim()
    .regex(/^[가-힣a-zA-Z0-9\s!@#$%^&*_+=\-~{}\\|()]+$/, {
      message: '한글, 영문, 숫자, 공백, 일부 특수문자(!@#$%^&*_+=\\-~{}|())만 허용합니다.',
    }),
});

// 템플릿 이름 입력 유효성 검사
export const templateNameValidation = z.object({
  name: z
    .string()
    .min(1, { message: '이름을 입력해주세요.' })
    .max(50, { message: '이름은 50자 이내로 입력해주세요.' })
    .trim()
    .regex(/^[가-힣a-zA-Z0-9\s!@#$%^&*_+=\-~{}\\|()]+$/, {
      message: '한글, 영문, 숫자, 공백, 일부 특수문자(!@#$%^&*_+=\\-~{}|())만 허용합니다.',
    }),
});
