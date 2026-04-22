const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface InverterInfo {
  id: number;
  sn: string;
  alias: string;
  gsn: string;
  pac: number;
  etoday: number;
  etotal: number;
  updateAt: string;
  plant?: {
    id: number;
    name: string;
    type: number;
  };
}

export interface InverterApiResponse {
  success: boolean;
  status_code: number;
  url: string;
  response_json?: {
    code: number;
    msg: string;
    data?: {
      pageSize: number;
      pageNumber: number;
      total: number;
      infos: InverterInfo[];
    };
    success: boolean;
  };
  response_text?: string;
}

export async function getInverters(): Promise<InverterInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/inverters`);

  if (!response.ok) {
    throw new Error(`Failed to load inverters: ${response.status}`);
  }

  const data: InverterApiResponse = await response.json();
  return data.response_json?.data?.infos ?? [];
}