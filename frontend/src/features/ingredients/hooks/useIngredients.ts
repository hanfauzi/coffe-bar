import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { ingredients as ingredientsApi } from '../api';
import { api } from '../../../lib/api';

export function useIngredients(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ingredientsQuery = useQuery({
    queryKey: ['ingredients', token],
    queryFn: () => ingredientsApi.list(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => ingredientsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Bahan baku baru berhasil disimpan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan bahan baku');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => ingredientsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Bahan baku berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui bahan baku');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ingredientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Bahan baku berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus bahan baku');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: (body: { ingredientId: string; quantityChange: number; type: string; notes: string }) => api.inventory.adjust(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Stok berhasil disesuaikan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyesuaikan stok');
    },
  });

  return {
    ingredients: ingredientsQuery.data || [],
    loading: ingredientsQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || adjustStockMutation.isPending,
    refetch: ingredientsQuery.refetch,
    createIngredient: createMutation.mutateAsync,
    updateIngredient: (id: string, body: any) => updateMutation.mutateAsync({ id, body }),
    deleteIngredient: deleteMutation.mutateAsync,
    adjustStock: adjustStockMutation.mutateAsync,
  };
}
