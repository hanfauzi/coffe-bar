import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { orders as ordersApi } from '../api';

export function useOrders(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ordersQuery = useQuery({
    queryKey: ['orders', token],
    queryFn: () => ordersApi.list(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => ordersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Pesanan berhasil dicatat');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mencatat pesanan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => ordersApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Pesanan berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui pesanan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Pesanan berhasil dibatalkan/dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pesanan');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body?: any }) => ordersApi.complete(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Pesanan berhasil diselesaikan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyelesaikan pesanan');
    },
  });

  return {
    orders: ordersQuery.data || [],
    loading: ordersQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || completeMutation.isPending,
    refetch: ordersQuery.refetch,
    createOrder: createMutation.mutateAsync,
    updateOrder: (id: string, body: any) => updateMutation.mutateAsync({ id, body }),
    deleteOrder: deleteMutation.mutateAsync,
    completeOrder: (id: string, body?: any) => completeMutation.mutateAsync({ id, body }),
  };
}
