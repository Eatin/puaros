import { BaseEntity } from '../entities/BaseEntity';

/**
 * Generic repository interface
 * Defines standard CRUD operations for entities
 */
export interface IRepository<T extends BaseEntity> {
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    save(entity: T): Promise<T>;
    update(entity: T): Promise<T>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
}