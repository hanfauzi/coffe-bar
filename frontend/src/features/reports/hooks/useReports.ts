import { useQuery } from '@tanstack/react-query';
import { reports as reportsApi } from '../api';

export function useReports(token: string | null) {
  const reportsQuery = useQuery({
    queryKey: ['reports', token],
    queryFn: async () => {
      const [dash, fins] = await Promise.all([
        reportsApi.dashboard(),
        reportsApi.financials(),
      ]);
      return { dashboardData: dash, financials: fins };
    },
    enabled: !!token,
  });

  return {
    dashboardData: reportsQuery.data?.dashboardData ?? null,
    financials: reportsQuery.data?.financials ?? null,
    loading: reportsQuery.isLoading,
    refetch: reportsQuery.refetch,
  };
}
