import { useQueryClient } from '@tanstack/react-query';
import { getGetKitchenStateQueryKey } from '@workspace/api-client-react';

export function useInvalidateKitchen() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: getGetKitchenStateQueryKey() });
}
