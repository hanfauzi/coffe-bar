import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { personalCups as personalCupsApi } from '../api';

export function usePersonalCups(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const consumptionsQuery = useQuery({
    queryKey: ['consumptions', token],
    queryFn: () => personalCupsApi.list(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => personalCupsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumptions'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Konsumsi pribadi berhasil disimpan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan catatan konsumsi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => personalCupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumptions'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Log konsumsi berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus log konsumsi');
    },
  });

  return {
    consumptions: consumptionsQuery.data || [],
    loading: consumptionsQuery.isLoading || createMutation.isPending || deleteMutation.isPending,
    refetch: consumptionsQuery.refetch,
    createConsumption: createMutation.mutateAsync,
    deleteConsumption: deleteMutation.mutateAsync,
  };
}
