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

        this.register('bottle', new BottleShape());
        this.register('carton', new CartonShape());
        this.register('jar', new JarShape());
        this.register('slices', new SlicesShape());
        this.register('box', new BoxShape());
    }

    register(key, strategy) {
        this._strategies.set(key, strategy);
        return this;
    }

    create(product) {
        return this._strategies.get(product?.shape) ?? this._fallback;
    }
}

export const shapeFactory = new ProductShapeFactory();
