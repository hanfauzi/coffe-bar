import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sales as salesApi } from '../api';

export function useSales(token: string | null) {
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ['sales', token],
    queryFn: async () => {
      const data = await salesApi.list();
      return data.map((sale: any) => ({
        ...sale,
        date: sale.date ?? sale.saleDate,
        totalAmount: sale.totalAmount ?? Number(sale.totalRevenue ?? 0),
      }));
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => salesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    sales: salesQuery.data || [],
    loading: salesQuery.isLoading || createMutation.isPending || deleteMutation.isPending,
    refetch: salesQuery.refetch,
    createSale: createMutation.mutateAsync,
    deleteSale: deleteMutation.mutateAsync,
  };
}
