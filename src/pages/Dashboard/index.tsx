import { Skeleton, Stack } from '@mui/material';

export default function PagesDashboard() {
  return (
    <Stack spacing={1}>
      <Skeleton height={200} />
      <Skeleton height={400} />
    </Stack>
  );
}
