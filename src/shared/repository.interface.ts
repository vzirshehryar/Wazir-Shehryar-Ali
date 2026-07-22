export interface IRepository<T, K = string> {
    findById(id: K): Promise<T | null>;
    create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    update(id: K, data: Partial<T>): Promise<T>;
    delete(id: K): Promise<void>;
  }