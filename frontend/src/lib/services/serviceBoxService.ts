import { mockServiceBoxes } from '../mock-data/serviceBoxes';
import { ServiceBox } from '@/types';

class ServiceBoxService {
  async getServiceBoxes(): Promise<ServiceBox[]> {
    // Simulating network delay
    return new Promise((resolve) => setTimeout(() => resolve(mockServiceBoxes), 500));
  }

  async getServiceBoxById(id: string): Promise<ServiceBox | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockServiceBoxes.find(sb => sb.id === id || sb.connectionObject === id));
      }, 300);
    });
  }

  async getServiceBoxesBySector(sectorRegionInfo: string): Promise<ServiceBox[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockServiceBoxes.filter(sb => sb.sectorRegionInfo === sectorRegionInfo));
      }, 300);
    });
  }
}

export const serviceBoxService = new ServiceBoxService();
