import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { expenses as expensesApi } from '../api';

export function useExpenses(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const expensesQuery = useQuery({
    queryKey: ['expenses', token],
    queryFn: async () => {
      const data = await expensesApi.list();
      return data.map((exp: any) => ({
        ...exp,
        totalCost: exp.totalCost ?? Number(exp.totalAmount ?? 0),
      }));
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => expensesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Catatan pembelian berhasil disimpan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan catatan pembelian');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Pembelian berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus catatan pembelian');
    },
  });

  return {
    expenses: expensesQuery.data || [],
    loading: expensesQuery.isLoading || createMutation.isPending || deleteMutation.isPending,
    refetch: expensesQuery.refetch,
    createExpense: createMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
  };
}
