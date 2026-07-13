import { request } from '../../lib/apiClient';

export const reports = {
  dashboard: () => request('/api/reports/dashboard'),
  financials: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return request(`/api/reports/financials${query ? `?${query}` : ''}`);
  },
};
