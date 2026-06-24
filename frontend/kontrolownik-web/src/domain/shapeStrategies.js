export class ShapeStrategy {
    get kind() {
        return 'abstract';
    }

    // eslint-disable-next-line no-unused-vars
    buildParts(product) {
        throw new Error('ShapeStrategy.buildParts() musi być nadpisane przez podklasę');
    }
}

export class BottleShape extends ShapeStrategy {
    get kind() {
        return 'bottle';
    }

    buildParts(product) {
        return [
            { kind: 'cyl', args: [0.13, 0.15, 0.32, 32], position: [0, 0.16, 0], material: { type: 'wrap', hex: product.hex, roughness: 0.35 } },
            { kind: 'cyl', args: [0.05, 0.1, 0.12, 24], position: [0, 0.37, 0], material: { type: 'plain', hex: product.hex, roughness: 0.3 } },
            { kind: 'cyl', args: [0.055, 0.055, 0.06, 24], position: [0, 0.45, 0], material: { type: 'plain', hex: '#b03030', roughness: 0.4 } },
        ];
    }
}

export class CartonShape extends ShapeStrategy {
    get kind() {
        return 'carton';
    }

    buildParts(product) {
        return [
            { kind: 'box', args: [0.3, 0.34, 0.3], position: [0, 0.17, 0], material: { type: 'label', hex: product.hex, wrap: true } },
            { kind: 'box', args: [0.3, 0.12, 0.06], position: [0, 0.4, 0], material: { type: 'plain', hex: product.hex, roughness: 0.45 } },
            { kind: 'cone', args: [0.001, 0.21, 0.16, 4, 1, false, Math.PI / 4], position: [0, 0.37, 0], material: { type: 'plain', hex: product.hex, roughness: 0.45 } },
        ];
    }
}

export class JarShape extends ShapeStrategy {
    get kind() {
        return 'jar';
    }

    buildParts(product) {
        return [
            { kind: 'cyl', args: [0.15, 0.15, 0.34, 32], position: [0, 0.17, 0], material: { type: 'wrap', hex: product.hex, roughness: 0.4 } },
            { kind: 'cyl', args: [0.155, 0.155, 0.07, 32], position: [0, 0.37, 0], material: { type: 'plain', hex: '#5a4632', roughness: 0.4 } },
        ];
    }
}

export class SlicesShape extends ShapeStrategy {
    get kind() {
        return 'slices';
    }

    buildParts(product) {
        return [
            { kind: 'box', args: [0.38, 0.16, 0.3], position: [0, 0.09, 0], material: { type: 'label', hex: product.hex, wrap: true } },
        ];
    }
}

export class BoxShape extends ShapeStrategy {
    get kind() {
        return 'box';
    }

    buildParts(product) {
        return [
            { kind: 'box', args: [0.34, 0.4, 0.28], position: [0, 0.2, 0], material: { type: 'label', hex: product.hex, wrap: true } },
        ];
    }
}
