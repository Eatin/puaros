import { BaseEntity } from '../../domain/entities/BaseEntity';
import { IRepository } from '../../domain/repositories/IRepository';

/**
 * Abstract base repository implementation
 * Provides common repository functionality
 */
export abstract class BaseRepository<T extends BaseEntity> implements IRepository<T> {
    protected readonly items: Map<string, T> = new Map();

    public async findById(id: string): Promise<T | null> {
        return this.items.get(id) ?? null;
    }

    public async findAll(): Promise<T[]> {
        return Array.from(this.items.values());
    }

    public async save(entity: T): Promise<T> {
        this.items.set(entity.id, entity);
        return entity;
    }

    public async update(entity: T): Promise<T> {
        if (!this.items.has(entity.id)) {
            throw new Error(`Entity with id ${entity.id} not found`);
        }
        this.items.set(entity.id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.items.delete(id);
    }

    public async exists(id: string): Promise<boolean> {
        return this.items.has(id);
    }
}