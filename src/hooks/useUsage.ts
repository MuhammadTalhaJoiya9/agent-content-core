import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, UsageStats } from '@/lib/api-client';

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage', 'stats'],
    queryFn: () => apiClient.getUsageStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useLogUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { resource_type: string; amount_used: number; project_id?: string }) =>
      apiClient.logUsage(data),
    onSuccess: () => {
      // Invalidate usage stats to get updated numbers
      queryClient.invalidateQueries({ queryKey: ['usage', 'stats'] });
    },
  });
};

// Helper to calculate usage percentages
export const calculateUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
};

// Helper to get usage status color
export const getUsageStatusColor = (percentage: number) => {
  if (percentage >= 90) return 'destructive';
  if (percentage >= 75) return 'warning';
  if (percentage >= 50) return 'info';
  return 'success';
};