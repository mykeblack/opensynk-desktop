import { apiGet } from './client';

export interface InverterInfo {
  id: number;
  sn: string;
  alias: string;
  gsn?: string;
  status?: number;
  pac?: number;
  etoday?: number;
  etotal?: number;
  updateAt?: string;
  plant?: {
    id?: number;
    name?: string;
  };
}

export async function getInverters(): Promise<InverterInfo[]> {
  return apiGet<InverterInfo[]>('/api/inverters');
}