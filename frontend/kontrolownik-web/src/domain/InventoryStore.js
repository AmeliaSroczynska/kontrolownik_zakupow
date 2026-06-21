/**
 * WZORZEC: Observer (Obserwator) + lekki Encapsulation/Domain Model
 * ------------------------------------------------------------------
 * `InventoryStore` to PODMIOT (Subject/Observable) trzymający aktualny stan
 * magazynowy (ilości produktów). Obserwatorzy (`subscribe`) są powiadamiani
 * przy każdej zmianie ilości oraz osobno o zdarzeniu NISKIEGO STANU
 * (quantity < minimum_quantity) – analogicznie do sygnałów Django po stronie
 * backendu, tylko że na froncie i w czystym OOP.
 *
 * Enkapsulacja: stan (`_quantities`) jest prywatny; mutacje przechodzą wyłącznie
 * przez metody `add` / `take`, które pilnują reguł (np. ilość ≥ 0) i emitują
 * powiadomienia. UI tylko subskrybuje i woła metody – nie modyfikuje stanu wprost.
 */
export class InventoryStore {
    /** @param {Array<{id:number, quantity:number, minimum_quantity?:number}>} products */
    constructor(products = []) {
        this._quantities = new Map(products.map((p) => [p.id, p.quantity]));
        this._minimums = new Map(products.map((p) => [p.id, p.minimum_quantity ?? 0]));
        /** @type {Set<Function>} obserwatorzy zmian stanu */
        this._observers = new Set();
        /** @type {Set<Function>} obserwatorzy zdarzeń niskiego stanu */
        this._lowStockObservers = new Set();
    }

    /**
     * Subskrypcja zmian stanu. Od razu wypycha bieżącą migawkę do nowego
     * obserwatora (wygodne dla Reacta – synchronizacja przy montażu).
     * @returns funkcja odsubskrybowania.
     */
    subscribe(observer) {
        this._observers.add(observer);
        observer(this.snapshot());
        return () => this._observers.delete(observer);
    }

    /** Subskrypcja zdarzeń niskiego stanu (alert). Zwraca funkcję odsubskrybowania. */
    onLowStock(observer) {
        this._lowStockObservers.add(observer);
        return () => this._lowStockObservers.delete(observer);
    }

    /** @returns {number} aktualna ilość produktu */
    getQuantity(id) {
        return this._quantities.get(id) ?? 0;
    }

    /** @returns {Record<number, number>} migawka wszystkich ilości (dla Reacta) */
    snapshot() {
        return Object.fromEntries(this._quantities);
    }

    /** Zwiększa ilość o 1 i powiadamia obserwatorów. */
    add(id) {
        this._set(id, this.getQuantity(id) + 1);
    }

    /** Zmniejsza ilość o 1 (nie poniżej 0) i powiadamia obserwatorów. */
    take(id) {
        this._set(id, Math.max(0, this.getQuantity(id) - 1));
    }

    // --- część prywatna (enkapsulacja reguł i powiadomień) ---

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
