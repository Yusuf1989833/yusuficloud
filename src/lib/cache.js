class Cache {
    constructor() {
        if (Cache.instance) {
            return Cache.instance;
        }

        this.store = new Map();
        Cache.instance = this;
        return this;
    }

    add(id, data) {
        if (!id || this.store.has(id)) {
            return null;
        }

        const socketData = {
            id,
            ...data,
            isActive: true,
            connectedAt: Date.now()
        };

        this.store.set(id, socketData);
        return socketData;
    }

    get(id) {
        if (!id || !this.store.has(id)) {
            return null;
        }
        return { ...this.store.get(id) };
    }

    remove(id) {
        if (!id || !this.store.has(id)) {
            return false;
        }
        this.store.delete(id);
        return true;
    }

    update(id, data) {
        if (!id || !this.store.has(id)) {
            return null;
        }
        const current = this.store.get(id);
        const updated = { ...current, ...data };
        this.store.set(id, updated);
        return updated;
    }

    getAll() {
        return Array.from(this.store.values());
    }
}

const cache = new Cache();
export default cache;