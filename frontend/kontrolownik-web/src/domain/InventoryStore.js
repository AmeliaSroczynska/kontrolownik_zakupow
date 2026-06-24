export class InventoryStore {
    constructor(products = []) {
        this._quantities = new Map(products.map((p) => [p.id, p.quantity]));
        this._minimums = new Map(products.map((p) => [p.id, p.minimum_quantity ?? 0]));
        this._observers = new Set();
        this._lowStockObservers = new Set();
    }

    subscribe(observer) {
        this._observers.add(observer);
        observer(this.snapshot());
        return () => this._observers.delete(observer);
    }

    onLowStock(observer) {
        this._lowStockObservers.add(observer);
        return () => this._lowStockObservers.delete(observer);
    }

    getQuantity(id) {
        return this._quantities.get(id) ?? 0;
    }

    snapshot() {
        return Object.fromEntries(this._quantities);
    }

    add(id) {
        this._set(id, this.getQuantity(id) + 1);
    }

    take(id) {
        this._set(id, Math.max(0, this.getQuantity(id) - 1));
    }

    _set(id, value) {
        this._quantities.set(id, value);
        this._notify();
        if (value < (this._minimums.get(id) ?? 0)) {
            this._notifyLowStock(id, value, this._minimums.get(id) ?? 0);
        }
    }

    _notify() {
        const snap = this.snapshot();
        this._observers.forEach((obs) => obs(snap));
    }

    _notifyLowStock(id, quantity, minimum) {
        this._lowStockObservers.forEach((obs) => obs({ id, quantity, minimum }));
    }
}
