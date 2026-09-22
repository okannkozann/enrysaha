import { mockServiceBoxes } from '../mock-data/serviceBoxes';
import { ServiceBox } from '@/types';

class ServiceBoxService {
  async getServiceBoxes(): Promise<ServiceBox[]> {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('enerya_service_boxes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return new Promise((resolve) => setTimeout(() => resolve(parsed), 300));
          }
        }
      } catch (e) {
        console.error('Cache load error in service:', e);
      }
    }
    // Simulating network delay for mock data
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
