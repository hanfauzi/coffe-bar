import { useQuery } from '@tanstack/react-query';
import { inventory as inventoryApi } from '../api';

export function useInventory(token: string | null) {
  const inventoryQuery = useQuery({
    queryKey: ['inventory', token],
    queryFn: () => inventoryApi.transactions(),
    enabled: !!token,
  });

  return {
    transactions: inventoryQuery.data || [],
    loading: inventoryQuery.isLoading,
    refetch: inventoryQuery.refetch,
  };
}
