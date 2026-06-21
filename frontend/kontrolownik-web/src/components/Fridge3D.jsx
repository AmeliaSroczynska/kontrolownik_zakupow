import { useMemo, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { normalizeProducts } from '../utils/productMeta.js';
import { shapeFactory } from '../domain/ProductShapeFactory.js';
import { InventoryStore } from '../domain/InventoryStore.js';

// Wczytanie tekstury bez zawieszania sceny (Suspense) – box renderuje się od
// razu w kolorze marki, a zdjęcie produktu pojawia się gdy się załaduje.
function useProductTexture(url) {
    const [texture, setTexture] = useState(null);
    useEffect(() => {
        let active = true;
        new THREE.TextureLoader().load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            if (active) setTexture(tex);
        });
        return () => { active = false; };
    }, [url]);
    return texture;
}

// --- Wymiary wnętrza lodówki (jednostki sceny) ---
const INNER_W = 2.4;     // szerokość wnętrza
const INNER_D = 1.4;     // głębokość wnętrza
const WALL = 0.12;       // grubość ścianek
const SHELF_GAP = 1.05;  // odstęp między półkami

// Ile sztuk pokazać na półce w zależności od ilości (czytelny zakres 1–6).
const stackCount = (quantity) => Math.max(1, Math.min(6, Math.round(quantity / 8)));

// --- Układ siatki: po MAX_ROWS półkach zaczynamy nową kolumnę, żeby lodówka
// nie rosła w nieskończoność w górę (czytelność na mobilce). ---
const MAX_ROWS = 6;

// Oblicza rozmieszczenie produktów w kolumnach (każda kolumna = osobna sekcja
// półek). Zwraca wymiary i pozycje, by korpus i kamera mogły się dopasować.
function computeLayout(count) {
    const cols = Math.ceil(count / MAX_ROWS);
    const rows = Math.min(count, MAX_ROWS);
    const colW = INNER_W;                         // szerokość jednej kolumny
    const colGap = WALL * 2;                       // przegroda między kolumnami
    const totalW = cols * colW + (cols - 1) * colGap;
    const height = rows * SHELF_GAP + 0.4;
    const placements = [];
    for (let i = 0; i < count; i++) {
        const col = Math.floor(i / MAX_ROWS);
        const row = i % MAX_ROWS;
        const x = -totalW / 2 + colW / 2 + col * (colW + colGap);
        const y = 0.35 + row * SHELF_GAP;
        placements.push({ col, row, x, y });
    }
    return { cols, rows, colW, colGap, totalW, height, placements };
}

const toggleStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 10,
    padding: '11px 18px',
    minHeight: '44px',
    borderRadius: '999px',
    border: 'none',
    background: 'rgba(255,255,255,0.94)',
    color: '#18181b',
    fontFamily: 'Onest, sans-serif',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
};


// Owija teksturę dookoła obwodu cylindra (etykieta butelki/słoika).
// Tekstura jest powtarzana po obwodzie, więc zdjęcie obejmuje cały korpus.
function WrapMaterial({ texture, hex, roughness = 0.4 }) {
    const map = useMemo(() => {
        if (!texture) return null;
        const t = texture.clone();
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.repeat.set(3, 1); // 3 powtórzenia etykiety po obwodzie
        t.needsUpdate = true;
        return t;
    }, [texture]);
    return <meshStandardMaterial map={map} color={map ? '#ffffff' : hex} roughness={roughness} metalness={0.04} />;
}

// Box z naklejoną etykietą (zdjęciem). Domyślnie tekstura tylko na froncie (+Z);
// z `wrap` – także na bokach (±X), żeby zdjęcie obejmowało więcej powierzchni.
// Kolejność slotów BoxGeometry: 0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z (front), 5:-Z (tył).
function LabeledBox({ texture, hex, args, position = [0, 0, 0], wrap = false }) {
    const sideMap = wrap ? texture : null;
    return (
        <mesh position={position} castShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial attach="material-0" map={sideMap} color={sideMap ? '#ffffff' : hex} roughness={0.45} metalness={0.05} />
            <meshStandardMaterial attach="material-1" map={sideMap} color={sideMap ? '#ffffff' : hex} roughness={0.45} metalness={0.05} />
            <meshStandardMaterial attach="material-2" color={hex} roughness={0.45} metalness={0.05} />
            <meshStandardMaterial attach="material-3" color={hex} roughness={0.45} metalness={0.05} />
            <meshStandardMaterial attach="material-4" map={texture} color={texture ? '#ffffff' : hex} roughness={0.5} />
            <meshStandardMaterial attach="material-5" map={texture} color={texture ? '#ffffff' : hex} roughness={0.45} metalness={0.05} />
        </mesh>
    );
}

// Renderer pojedynczej CZĘŚCI bryły opisanej deklaratywnie przez strategię
// kształtu (patrz domain/shapeStrategies.js). Zamienia opis { kind, args,
// position, material } na konkretny mesh Three.js.
function ShapePart({ part, texture }) {
    const { kind, args, position, material } = part;
    const geom = kind === 'box'
        ? <boxGeometry args={args} />
        : <cylinderGeometry args={args} />; // 'cyl' i 'cone' to ten sam geometr z różnymi promieniami

    // Box z etykietą obsługujemy istniejącym komponentem (multi-material).
    if (kind === 'box' && material.type === 'label') {
        return <LabeledBox texture={texture} hex={material.hex} args={args} position={position} wrap={material.wrap} />;
    }

    return (
        <mesh position={position} castShadow>
            {geom}
            {material.type === 'wrap'
                ? <WrapMaterial texture={texture} hex={material.hex} roughness={material.roughness} />
                : <meshStandardMaterial color={material.hex} roughness={material.roughness ?? 0.45} />}
        </mesh>
    );
}

// Bryła produktu budowana przez WZORZEC Strategy + Factory: fabryka dobiera
// strategię po typie jednostki (`product.shape`), strategia opisuje części,
// a `ShapePart` je renderuje. Brak `switch` – nowy kształt = nowa klasa.
function ProductShape({ product, texture }) {
    const parts = useMemo(() => shapeFactory.create(product).buildParts(product), [product]);
    return (
        <group>
            {parts.map((part, i) => (
                <ShapePart key={i} part={part} texture={texture} />
            ))}
        </group>
    );
}

// Produkty stojące na jednej półce – rządek brył, którego długość odzwierciedla
// aktualny stan. Klik otwiera w scenie panel +/− (bez wychodzenia z widoku 3D).
// `visible` (drzwi otwarte) decyduje, czy produkty są w ogóle pokazywane/klikalne.
function ProductRow({ product, y, quantity, onAdd, onTake, visible }) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [open, setOpen] = useState(false);
    const texture = useProductTexture(product.image);

    const count = stackCount(quantity);
    const itemW = 0.42;
    const gap = 0.06;
    const totalW = count * itemW + (count - 1) * gap;
    const startX = -totalW / 2 + itemW / 2;

    useFrame(() => {
        if (!groupRef.current) return;
        const target = hovered || open ? 1.1 : 1;
        groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.18);
    });

    // Drzwi zamknięte → nic nie pokazujemy (brak brył, etykiet i interakcji).
    if (!visible) return null;

    return (
        <group position={[0, y, 0]}>
            <group
                ref={groupRef}
                onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                {Array.from({ length: count }).map((_, i) => (
                    <group key={i} position={[startX + i * (itemW + gap), 0, 0]}>
                        <ProductShape product={product} texture={texture} />
                    </group>
                ))}
            </group>

            {/* Etykieta lub panel +/− po kliknięciu */}
            <Html position={[totalW / 2 + 0.22, 0.3, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
                {open ? (
                    <div style={panelStyle(product.hex)}>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>{product.name}</div>
                        <div style={panelRow}>
                            <button style={stepBtn} onClick={(e) => { e.stopPropagation(); onTake(); }}>−</button>
                            <span style={{ fontWeight: 800, minWidth: 54, textAlign: 'center' }}>
                                {quantity}{product.isPercent ? '%' : ''}
                            </span>
                            <button style={stepBtn} onClick={(e) => { e.stopPropagation(); onAdd(); }}>+</button>
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{product.unit}</div>
                        <button style={closeBtn} onClick={(e) => { e.stopPropagation(); setOpen(false); }}>zamknij</button>
                    </div>
                ) : (
                    <div
                        style={labelStyle(product.hex, hovered)}
                        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <strong>{product.name}</strong>
                        <span>{quantity} {product.unit}</span>
                    </div>
                )}
            </Html>
        </group>
    );
}

const panelStyle = (hex) => ({
    background: '#ffffff',
    borderTop: `5px solid ${hex}`,
    borderRadius: '18px',
    padding: '14px 16px',
    fontFamily: 'Onest, sans-serif',
    fontSize: '15px',
    color: '#18181b',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    width: 170,
    textAlign: 'center',
    userSelect: 'none',
    touchAction: 'manipulation',
});

const panelRow = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 };

// 44px = zalecany minimalny rozmiar celu dotykowego na mobilkach.
const stepBtn = {
    width: 44, height: 44, borderRadius: '50%', border: 'none',
    background: '#18181b', color: '#fff', fontSize: 24, fontWeight: 800,
    cursor: 'pointer', lineHeight: 1, touchAction: 'manipulation',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
};

const closeBtn = {
    marginTop: 12, border: 'none', background: '#f4f4f5', borderRadius: '999px',
    padding: '8px 16px', color: '#52525b', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Onest, sans-serif', touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
};

function labelStyle(hex, hovered = false) {
    return {
        background: hovered ? '#ffffff' : 'rgba(255,255,255,0.92)',
        borderLeft: `4px solid ${hex}`,
        borderRadius: '12px',
        padding: '7px 11px',
        fontFamily: 'Onest, sans-serif',
        fontSize: '13px',
        lineHeight: 1.15,
        whiteSpace: 'nowrap',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.18)',
        color: '#18181b',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
    };
}

// Pojedyncza półka (szklana taca) – w danej kolumnie (x).
function Shelf({ x, y }) {
    return (
        <mesh position={[x, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[INNER_W, 0.04, INNER_D]} />
            <meshPhysicalMaterial color="#cfeefc" transmission={0.6} transparent opacity={0.5} roughness={0.1} />
        </mesh>
    );
}

// Drzwi lodówki – animowane otwieranie/zamykanie na klik, z magnesem (logo
// samorządu) na froncie. Zawias na lewej krawędzi; drzwi otwierają się w lewo
// (na zewnątrz, w stronę widza), odsłaniając wnętrze.
const DOOR_OPEN = -Math.PI * 0.9;    // kąt pełnego otwarcia (prawie płasko w bok)
const DOOR_CLOSED = 0;
const DOOR_TH = 0.1;                  // grubość drzwi

function FridgeDoor({ height, doorW, hingeX, frontZ, open, onToggle }) {
    const ref = useRef();
    const [hovered, setHovered] = useState(false);
    const logo = useProductTexture('/logo-wit.svg');
    const doorH = height + WALL * 2;

    useFrame(() => {
        if (!ref.current) return;
        const target = open ? DOOR_OPEN : DOOR_CLOSED;
        ref.current.rotation.y += (target - ref.current.rotation.y) * 0.15;
    });

    const skin = hovered ? '#f3f6fa' : '#fbfdff';

    return (
        // zawias: lewy przedni narożnik korpusu; drzwi rozciągają się w prawo (+X)
        <group ref={ref} position={[hingeX, height / 2, frontZ]} rotation={[0, DOOR_CLOSED, 0]}>
            <group
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                {/* płyta drzwi (nieprzezroczysta, jak prawdziwa lodówka) */}
                <mesh position={[doorW / 2, 0, DOOR_TH / 2]} castShadow receiveShadow>
                    <boxGeometry args={[doorW, doorH, DOOR_TH]} />
                    <meshStandardMaterial color={skin} roughness={0.35} metalness={0.08} />
                </mesh>
                {/* wcięty panel na froncie – nadaje głębi */}
                <mesh position={[doorW / 2, 0, DOOR_TH + 0.001]}>
                    <planeGeometry args={[doorW - 0.18, doorH - 0.18]} />
                    <meshStandardMaterial color="#eef2f7" roughness={0.45} />
                </mesh>
                {/* pionowy uchwyt przy krawędzi otwierania (po prawej, daleko od zawiasu) */}
                <mesh position={[doorW - 0.16, 0, DOOR_TH + 0.06]} castShadow>
                    <boxGeometry args={[0.06, doorH * 0.62, 0.06]} />
                    <meshStandardMaterial color="#aeb6bf" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* MAGNES z logo samorządu na froncie drzwi */}
                <group position={[doorW * 0.46, height * 0.26, DOOR_TH + 0.01]}>
                    <mesh>
                        <circleGeometry args={[0.28, 48]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0, 0.001]}>
                        <ringGeometry args={[0.255, 0.28, 48]} />
                        <meshStandardMaterial color="#E4002B" roughness={0.4} />
                    </mesh>
                    {logo && (
                        <mesh position={[0, 0, 0.002]}>
                            <planeGeometry args={[0.36, 0.36]} />
                            <meshStandardMaterial map={logo} transparent roughness={0.5} />
                        </mesh>
                    )}
                </group>
            </group>
        </group>
    );
}

// Korpus lodówki – zamknięte pudło (jak prawdziwa lodówka) z drzwiami z przodu.
// Wnętrze (półki + produkty) jest wpuszczone; po zamknięciu drzwi je zasłaniają.
function FridgeBody({ height, totalW, cols, colW, colGap, doorOpen, onToggleDoor }) {
    const half = height / 2;
    const shell = '#e9edf2';   // obudowa zewnętrzna (lekko ciepła biel)
    const inner = '#fbfcfe';   // wnętrze
    const trim = '#dfe4ea';    // ramka frontu
    const outerW = totalW + WALL * 2;
    const depth = INNER_D + WALL * 2;
    const frontZ = INNER_D / 2 + WALL / 2;  // czoło korpusu
    const fullH = height + WALL * 2;

    return (
        <group>
            {/* === Obudowa zewnętrzna (pełne, nieprzezroczyste ścianki) === */}
            {/* tył */}
            <mesh position={[0, half, -INNER_D / 2 - WALL / 2]} receiveShadow castShadow>
                <boxGeometry args={[outerW, fullH, WALL]} />
                <meshStandardMaterial color={shell} roughness={0.55} metalness={0.06} />
            </mesh>
            {/* lewa */}
            <mesh position={[-totalW / 2 - WALL / 2, half, 0]} receiveShadow castShadow>
                <boxGeometry args={[WALL, fullH, depth]} />
                <meshStandardMaterial color={shell} roughness={0.55} metalness={0.06} />
            </mesh>
            {/* prawa */}
            <mesh position={[totalW / 2 + WALL / 2, half, 0]} receiveShadow castShadow>
                <boxGeometry args={[WALL, fullH, depth]} />
                <meshStandardMaterial color={shell} roughness={0.55} metalness={0.06} />
            </mesh>
            {/* podłoga */}
            <mesh position={[0, 0, 0]} receiveShadow castShadow>
                <boxGeometry args={[outerW, WALL, depth]} />
                <meshStandardMaterial color={shell} roughness={0.55} metalness={0.06} />
            </mesh>
            {/* sufit */}
            <mesh position={[0, height, 0]} receiveShadow castShadow>
                <boxGeometry args={[outerW, WALL, depth]} />
                <meshStandardMaterial color={shell} roughness={0.55} metalness={0.06} />
            </mesh>

            {/* === Wyściółka wnętrza (jaśniejsza, matowa) === */}
            <mesh position={[0, half, -INNER_D / 2 + 0.012]} receiveShadow>
                <boxGeometry args={[totalW, height, 0.02]} />
                <meshStandardMaterial color={inner} roughness={0.85} />
            </mesh>

            {/* przegrody między kolumnami */}
            {Array.from({ length: Math.max(0, cols - 1) }).map((_, i) => {
                const x = -totalW / 2 + (i + 1) * colW + i * colGap + colGap / 2;
                return (
                    <mesh key={i} position={[x, half, 0]} receiveShadow>
                        <boxGeometry args={[WALL, height, INNER_D]} />
                        <meshStandardMaterial color={inner} roughness={0.8} />
                    </mesh>
                );
            })}

            {/* === Ramka frontu wokół otworu (żeby drzwi miały do czego przylegać) === */}
            {/* górna belka */}
            <mesh position={[0, height + WALL / 2, frontZ - WALL / 2]} castShadow>
                <boxGeometry args={[outerW, WALL, WALL]} />
                <meshStandardMaterial color={trim} roughness={0.5} />
            </mesh>
            {/* dolna belka */}
            <mesh position={[0, -WALL / 2, frontZ - WALL / 2]} castShadow>
                <boxGeometry args={[outerW, WALL, WALL]} />
                <meshStandardMaterial color={trim} roughness={0.5} />
            </mesh>
            {/* boczne słupki */}
            <mesh position={[-totalW / 2 - WALL / 2, half, frontZ - WALL / 2]} castShadow>
                <boxGeometry args={[WALL, fullH, WALL]} />
                <meshStandardMaterial color={trim} roughness={0.5} />
            </mesh>
            <mesh position={[totalW / 2 + WALL / 2, half, frontZ - WALL / 2]} castShadow>
                <boxGeometry args={[WALL, fullH, WALL]} />
                <meshStandardMaterial color={trim} roughness={0.5} />
            </mesh>

            <FridgeDoor
                height={height}
                doorW={outerW}
                hingeX={-totalW / 2 - WALL}
                frontZ={frontZ}
                open={doorOpen}
                onToggle={onToggleDoor}
            />
        </group>
    );
}

// Ustawia POCZĄTKOWE kadrowanie po zmianie rozmiaru sceny: pozycja kamery +
// pivot orbity w środku lodówki (świat y=0), żeby obrót kręcił się wokół bryły.
// Robi to raz (gdy kontrolki są już zamontowane); nie nadpisuje ruchu usera.
function CameraRig({ height, totalW, controlsRef }) {
    const { camera } = useThree();
    useEffect(() => {
        let raf;
        const frame = () => {
            const ctrls = controlsRef.current;
            if (!ctrls) { raf = requestAnimationFrame(frame); return; } // czekaj na OrbitControls
            const span = Math.max(height, totalW * 0.9);
            const dist = span * 1.35 + 2.8;
            camera.position.set(dist * 0.5, height * 0.18, dist * 0.85);
            camera.far = dist * 4 + 50;
            camera.updateProjectionMatrix();
            ctrls.target.set(0, 0, 0);
            ctrls.update();
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [camera, height, totalW, controlsRef]);
    return null;
}

function Scene({ products, quantities, onAdd, onTake, doorOpen, onToggleDoor, productsVisible }) {
    const layout = useMemo(() => computeLayout(products.length), [products.length]);
    const { height, totalW, cols, colW, colGap, placements } = layout;
    const controlsRef = useRef();

    return (
        <>
            <CameraRig height={height} totalW={totalW} controlsRef={controlsRef} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-5, 4, 3]} intensity={0.5} />
            <pointLight position={[0, height, 2]} intensity={0.8} distance={14} />

            <group position={[0, -height / 2, 0]}>
                <FridgeBody
                    height={height} totalW={totalW} cols={cols} colW={colW} colGap={colGap}
                    doorOpen={doorOpen} onToggleDoor={onToggleDoor}
                />
                {products.map((p, i) => {
                    const { x, y } = placements[i];
                    return (
                        <group key={p.id} position={[x, 0, 0]}>
                            <Shelf x={0} y={y} />
                            <ProductRow
                                key={productsVisible ? 'on' : 'off'}
                                product={p}
                                y={y}
                                quantity={quantities[p.id]}
                                onAdd={() => onAdd(p.id)}
                                onTake={() => onTake(p.id)}
                                visible={productsVisible}
                            />
                        </group>
                    );
                })}
            </group>

            <ContactShadows position={[0, -height / 2 - 0.01, 0]} opacity={0.4} scale={Math.max(8, totalW * 2)} blur={2.5} far={4} />
            <OrbitControls
                ref={controlsRef}
                makeDefault
                enablePan={false}
                enableZoom
                zoomToCursor
                zoomSpeed={0.9}
                rotateSpeed={0.85}
                minDistance={3}
                maxDistance={Math.max(18, height * 2.4)}
                minPolarAngle={0.18}
                maxPolarAngle={Math.PI - 0.18}
                enableDamping
                dampingFactor={0.12}
            />
        </>
    );
}

export default function Fridge3D({ products: rawProducts }) {
    // Montujemy <Canvas> dopiero, gdy kontener ma realny rozmiar – inaczej przy
    // bezpośrednim wejściu na /fridge R3F potrafi wystartować z zerowym rozmiarem
    // i nie wyrenderować sceny (wyścig układu strony).
    const wrapRef = useRef(null);
    const [size, setSize] = useState(null);
    const [doorOpen, setDoorOpen] = useState(false); // drzwi: domyślnie zamknięte

    // Produkty pokazujemy dopiero gdy drzwi zdążyły się odsłonić, a chowamy
    // NATYCHMIAST przy zamykaniu (żeby nie prześwitywały zza zamykających się
    // drzwi). `openedEnough` opóźnia tylko moment ODSŁONIĘCIA.
    const [openedEnough, setOpenedEnough] = useState(false);
    useEffect(() => {
        if (!doorOpen) return undefined;
        const t = setTimeout(() => setOpenedEnough(true), 280);
        return () => { clearTimeout(t); setOpenedEnough(false); };
    }, [doorOpen]);
    const productsVisible = doorOpen && openedEnough;

    // Normalizacja: każdy produkt (także nowa kategoria z backendu) dostaje
    // gwarantowane pola hex/image/shape/isPercent używane przez scenę.
    const products = useMemo(() => normalizeProducts(rawProducts), [rawProducts]);

    // WZORZEC Observer: stanem ilości zarządza InventoryStore (Subject). React
    // jest jego obserwatorem – `quantities` to migawka, którą store odświeża po
    // każdej zmianie. Panel +/− woła metody store'a, nie modyfikuje stanu wprost.
    const store = useMemo(() => new InventoryStore(products), [products]);
    const [quantities, setQuantities] = useState(() => store.snapshot());
    useEffect(() => {
        // subscribe od razu wypycha bieżącą migawkę (synchronizacja przy montażu)
        const unsubscribe = store.subscribe(setQuantities);
        // drugi obserwator: alert niskiego stanu (analogiczny do sygnałów Django)
        const unsubscribeLow = store.onLowStock(({ id, quantity, minimum }) => {
            const p = products.find((x) => x.id === id);
            console.warn(`[Lodówka] Niski stan: ${p?.name ?? id} = ${quantity} (min ${minimum})`);
        });
        return () => { unsubscribe(); unsubscribeLow(); };
    }, [store, products]);
    const addOne = (id) => store.add(id);
    const takeOne = (id) => store.take(id);

    useLayoutEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const update = () => {
            const r = el.getBoundingClientRect();
            // Montujemy dopiero przy realnym rozmiarze w OBU osiach – inaczej R3F
            // wystartuje z domyślnym 300x150 i nie przemierzy się po zmianie szerokości.
            if (r.width > 0 && r.height > 0) {
                setSize((prev) => (prev && prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }));
            }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Przycisk otwierania/zamykania drzwi */}
            <button onClick={() => setDoorOpen((d) => !d)} style={toggleStyle}>
                {doorOpen ? '🚪 Zamknij' : '❄️ Otwórz'}
            </button>

            {size && (
                <Canvas
                    key={`${Math.round(size.w)}x${Math.round(size.h)}`}
                    shadows
                    camera={{ position: [3.5, 2.5, 6], fov: 42 }}
                    dpr={[1, 2]}
                    style={{ width: `${size.w}px`, height: `${size.h}px` }}
                >
                    <color attach="background" args={['#0e0e11']} />
                    <Scene
                        products={products} quantities={quantities}
                        onAdd={addOne} onTake={takeOne}
                        doorOpen={doorOpen} onToggleDoor={() => setDoorOpen((d) => !d)}
                        productsVisible={productsVisible}
                    />
                </Canvas>
            )}
        </div>
    );
}
