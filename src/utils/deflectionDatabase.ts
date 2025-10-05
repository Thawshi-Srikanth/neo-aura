export interface DeflectionRecord {
  id: string;
  asteroidId: string;
  asteroidName: string;
  timestamp: number;
  method: string;
  success: boolean;
  originalOrbit: {
    eccentricity: number;
    inclination: number;
    semiMajorAxis: number;
    velocity: number;
    missDistance: number;
  };
  deflectedOrbit: {
    eccentricity: number;
    inclination: number;
    semiMajorAxis: number;
    velocity: number;
    missDistance: number;
  };
  impactProbabilityReduction: number;
  energyRequired: number;
  confidence: number;
  cost: number;
  timeRequired: number;
}

export interface DeflectionStats {
  totalAttempts: number;
  successfulDeflections: number;
  successRate: number;
  totalCost: number;
  averageEnergyRequired: number;
  methodsUsed: { [method: string]: number };
  asteroidsDeflected: string[];
}

export class DeflectionDatabase {
  private static readonly DB_NAME = 'neo_aura_deflections';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'deflections';

  /**
   * Initialize IndexedDB
   */
  static async initialize(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('asteroidId', 'asteroidId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('method', 'method', { unique: false });
          store.createIndex('success', 'success', { unique: false });
        }
      };
    });
  }

  /**
   * Save deflection record
   */
  static async saveDeflection(record: DeflectionRecord): Promise<void> {
    const db = await this.initialize();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all deflection records
   */
  static async getAllDeflections(): Promise<DeflectionRecord[]> {
    const db = await this.initialize();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get deflections for specific asteroid
   */
  static async getDeflectionsByAsteroid(asteroidId: string): Promise<DeflectionRecord[]> {
    const db = await this.initialize();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('asteroidId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(asteroidId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get deflection statistics
   */
  static async getDeflectionStats(): Promise<DeflectionStats> {
    const allDeflections = await this.getAllDeflections();
    
    const totalAttempts = allDeflections.length;
    const successfulDeflections = allDeflections.filter(d => d.success).length;
    const successRate = totalAttempts > 0 ? successfulDeflections / totalAttempts : 0;
    const totalCost = allDeflections.reduce((sum, d) => sum + d.cost, 0);
    const averageEnergyRequired = allDeflections.length > 0 
      ? allDeflections.reduce((sum, d) => sum + d.energyRequired, 0) / allDeflections.length 
      : 0;
    
    const methodsUsed: { [method: string]: number } = {};
    allDeflections.forEach(d => {
      methodsUsed[d.method] = (methodsUsed[d.method] || 0) + 1;
    });
    
    const asteroidsDeflected = [...new Set(allDeflections
      .filter(d => d.success)
      .map(d => d.asteroidId)
    )];
    
    return {
      totalAttempts,
      successfulDeflections,
      successRate,
      totalCost,
      averageEnergyRequired,
      methodsUsed,
      asteroidsDeflected
    };
  }

  /**
   * Get recent deflections (last 10)
   */
  static async getRecentDeflections(limit: number = 10): Promise<DeflectionRecord[]> {
    const allDeflections = await this.getAllDeflections();
    return allDeflections
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all deflection data
   */
  static async clearAllData(): Promise<void> {
    const db = await this.initialize();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export deflection data as JSON
   */
  static async exportData(): Promise<string> {
    const data = await this.getAllDeflections();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import deflection data from JSON
   */
  static async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData) as DeflectionRecord[];
    
    for (const record of data) {
      await this.saveDeflection(record);
    }
  }
}
