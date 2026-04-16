// ── Vehicle domain model ──────────────────────────────────────────────────────

export type VehicleType = 'SCOOTER' | 'KICK_SCOOTER' | 'CAR';
export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'IN_RENTAL' | 'MAINTENANCE' | 'CHARGING';

export interface Vehicle {
  id: string;
  model: string;
  type: VehicleType;
  status: VehicleStatus;
  batteryLevel: number;     // 0–100
  stationId: string;
  stationName: string;
  latitude?: number;
  longitude?: number;
}

// ── API response ──────────────────────────────────────────────────────────────

export interface VehiclesAcceptedResponse {
  message: string;
  processInstanceKey?: string;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

export interface VehicleStats {
  total: number;
  scooters: number;
  kickScooters: number;
  cars: number;
}

export const EMPTY_STATS: VehicleStats = {
  total: 0,
  scooters: 0,
  kickScooters: 0,
  cars: 0,
};

export function computeStats(vehicles: Vehicle[]): VehicleStats {
  return {
    total: vehicles.length,
    scooters: vehicles.filter(v => v.type === 'SCOOTER').length,
    kickScooters: vehicles.filter(v => v.type === 'KICK_SCOOTER').length,
    cars: vehicles.filter(v => v.type === 'CAR').length,
  };
}

export function vehicleIcon(type: VehicleType): string {
  const icons: Record<VehicleType, string> = {
    SCOOTER: '🛵',
    KICK_SCOOTER: '🛴',
    CAR: '🚗',
  };
  return icons[type] ?? '🚗';
}

export function batteryClass(level: number): 'high' | 'medium' | 'low' {
  if (level >= 50) return 'high';
  if (level >= 20) return 'medium';
  return 'low';
}
