const UNIT_TO_SHAPE = {
    BTL: 'bottle', CRT: 'carton', CAP: 'jar', SLI: 'slices', PCS: 'box',
};

const TEXT_SHAPE_HINTS = [
    [/butel/i, 'bottle'],
    [/karton/i, 'carton'],
    [/kapsu|s[łl]oik/i, 'jar'],
    [/plaster/i, 'slices'],
];

function isPercentUnit(unit, unitDisplay) {
    const u = `${unit || ''} ${unitDisplay || ''}`.toLowerCase();
    return /%|butel|karton/.test(u) || unit === 'BTL' || unit === 'CRT';
}

function shapeFromUnit(unit, unitText) {
    if (unit && UNIT_TO_SHAPE[unit]) return UNIT_TO_SHAPE[unit];
    for (const [re, shape] of TEXT_SHAPE_HINTS) {
        if (re.test(unitText || '')) return shape;
    }
    return 'box';
}

function colorFromName(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue}, 62%, 62%)`;
}

export function normalizeProduct(p) {
    const unitText = p.unit_display || p.unit || '';
    return {
        ...p,
        hex: p.hex || colorFromName(p.name || 'produkt'),
        image: p.image || (p.slug ? `/images/${p.slug}.png` : null),
        unitText,
        shape: shapeFromUnit(p.unit, unitText),
        isPercent: isPercentUnit(p.unit, unitText),
    };
}

export function normalizeProducts(products) {
    return products.map(normalizeProduct);
}
