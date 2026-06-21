/**
 * WZORZEC: Factory Method + Singleton
 * ------------------------------------------------------------------
 * Factory: jedna klasa odpowiada za DOBÓR i UTWORZENIE właściwej strategii
 * kształtu (Strategy) na podstawie typu produktu (`product.shape`). Reszta
 * aplikacji nie zna konkretnych klas kształtów ani logiki wyboru – woła
 * tylko `factory.create(product)`.
 *
 * Singleton: istnieje dokładnie JEDEN rejestr strategii (`shapeFactory`).
 * Strategie są bezstanowe, więc trzymamy po jednej instancji każdej (flyweight-
 * owo), a fabryka je współdzieli. Rejestracja nowego kształtu (`register`)
 * rozszerza fabrykę bez modyfikacji jej kodu (Open/Closed).
 */
import {
    BottleShape,
    CartonShape,
    JarShape,
    SlicesShape,
    BoxShape,
} from './shapeStrategies.js';

export class ProductShapeFactory {
    constructor() {
        /** @type {Map<string, import('./shapeStrategies.js').ShapeStrategy>} */
        this._strategies = new Map();
        this._fallback = new BoxShape();

        // Rejestr domyślnych strategii (klucz = typ jednostki/kształtu).
        this.register('bottle', new BottleShape());
        this.register('carton', new CartonShape());
        this.register('jar', new JarShape());
        this.register('slices', new SlicesShape());
        this.register('box', new BoxShape());
    }

    /**
     * Rejestruje strategię pod danym kluczem (rozszerzalność bez zmiany kodu).
     * @param {string} key
     * @param {import('./shapeStrategies.js').ShapeStrategy} strategy
     */
    register(key, strategy) {
        this._strategies.set(key, strategy);
        return this;
    }

    /**
     * Factory Method: zwraca strategię kształtu dla produktu.
     * Nieznany typ → bezpieczny fallback (pudełko).
     * @param {{shape?:string}} product
     * @returns {import('./shapeStrategies.js').ShapeStrategy}
     */
    create(product) {
        return this._strategies.get(product?.shape) ?? this._fallback;
    }
}

/** Singleton – jedyna współdzielona instancja fabryki w całej aplikacji. */
export const shapeFactory = new ProductShapeFactory();
