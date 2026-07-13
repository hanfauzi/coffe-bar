import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
import { menus as menusApi } from '../api';

export function useMenus(token: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const menusQuery = useQuery({
    queryKey: ['menus', token],
    queryFn: () => menusApi.list(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => menusApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Menu dan formulir resep berhasil disimpan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan menu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menusApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Menu berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus menu');
    },
  });

  return {
    menus: menusQuery.data || [],
    loading: menusQuery.isLoading || createMutation.isPending || deleteMutation.isPending,
    refetch: menusQuery.refetch,
    createMenu: createMutation.mutateAsync,
    deleteMenu: deleteMutation.mutateAsync,
  };
}
