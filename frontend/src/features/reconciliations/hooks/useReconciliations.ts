import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { reconciliations as reconApi } from '../api';

export function useReconciliations(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reconciliationsQuery = useQuery({
    queryKey: ['reconciliations', token],
    queryFn: () => reconApi.list(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => reconApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan rekonsiliasi');
    },
  });

  return {
    reconciliations: reconciliationsQuery.data || [],
    loading: reconciliationsQuery.isLoading || createMutation.isPending,
    refetch: reconciliationsQuery.refetch,
    createReconciliation: createMutation.mutateAsync,
  };
}
