/**
 * Mapa de puntos de Latinoamérica: Argentina (con las Islas Malvinas)
 * resaltada, el resto de la región atenuado y arcos desde el punto de origen
 * hacia los países de la red. Pensado para fondo claro.
 *
 * Las siluetas son polígonos aproximados en (longitud, latitud); alcanza para
 * una ilustración de puntos y evita cargar datos geográficos. Los puntos se
 * calculan una sola vez al cargar el módulo.
 */

export type Point = [number, number];

export const ARGENTINA: Point[] = [
  [-65.5, -22], [-62.5, -22], [-58, -24.5], [-57.5, -27], [-54, -25.6], [-54, -27.5], [-57.5, -30.2], [-58.3, -33.5],
  [-56.7, -36.5], [-57.5, -38], [-62, -39], [-65, -41], [-63, -42.5], [-65, -45], [-67, -46], [-66, -48], [-69, -51],
  [-68.5, -52.5], [-66, -55], [-70, -55], [-72, -52], [-73, -50], [-71.5, -45], [-71.5, -40], [-70.5, -36], [-70, -32],
  [-69.5, -27.5], [-68.3, -24.5], [-67, -22.8],
];

// Islas Malvinas: son chicas para la grilla, así que sus puntos van a mano.
const MALVINAS: Point[] = [
  [-60.4, -51.6],
  [-58.9, -51.6],
  [-59.7, -52.5],
];

const BRAZIL: Point[] = [
  [-60, 5], [-52, 4.5], [-50, 1], [-48, -1], [-44, -2.5], [-39, -3.5], [-35, -6], [-35, -9], [-38, -13], [-39, -17],
  [-41, -22], [-45, -23.5], [-48, -26], [-49, -29], [-52, -33], [-53.5, -33.5], [-57.5, -30.2], [-54, -27.5],
  [-54, -25.6], [-55.5, -24], [-58, -20], [-58, -16.5], [-60.5, -13.5], [-65, -12], [-65.5, -10], [-70.5, -11],
  [-73.5, -9], [-73, -5], [-70, -4.2], [-69.5, 1], [-67, 2], [-64, 4.2],
];

const SOUTH_AMERICA: Point[] = [
  [-77, 8], [-72, 12], [-67, 11], [-62, 10.5], [-60, 8], [-57, 6], [-52, 5], [-50, 1], [-48, -1], [-44, -2.5],
  [-39, -3.5], [-35, -6], [-35, -9], [-38, -13], [-39, -17], [-41, -22], [-45, -23.5], [-48, -26], [-49, -29],
  [-52, -33], [-54, -34.5], [-57, -35], [-57, -38], [-62, -39], [-65, -41], [-63, -42.5], [-65, -45], [-67, -46],
  [-66, -48], [-69, -51], [-68, -53], [-66, -55], [-70, -55], [-73, -53], [-75, -50], [-74, -45], [-73, -40],
  [-73.5, -37], [-71.5, -32], [-70.5, -25], [-70, -18.5], [-75, -15], [-77, -12], [-79, -8], [-81, -5], [-80, -2],
  [-80, 1], [-78, 2.5], [-77.5, 6],
];

const MEXICO_CENTRAL: Point[] = [
  [-117, 32.5], [-111, 31.5], [-106.5, 31.8], [-103, 29], [-99.5, 27], [-97.3, 25.8], [-97.7, 22], [-96, 19],
  [-94, 18.3], [-91, 18.8], [-90.5, 21], [-87, 21.5], [-87.5, 18], [-88.5, 16], [-84, 15.5], [-83.5, 11], [-82, 9],
  [-79, 9.5], [-77.3, 8.5], [-78, 7.5], [-80, 7.5], [-83, 8.5], [-85.7, 10], [-87.5, 13], [-91, 14], [-94, 16],
  [-97, 15.8], [-101, 17.5], [-105, 19.5], [-105.5, 22], [-108, 25], [-110, 27.5], [-112.5, 30], [-114.5, 31.5],
];

const BAJA: Point[] = [
  [-117, 32.5], [-114.8, 31.8], [-112.5, 27.5], [-110, 24], [-109.5, 23], [-110.5, 23.5], [-112, 25.5],
  [-114.5, 28.5], [-116, 30.5],
];

export function inside([x, y]: Point, polygon: Point[]) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      hit = !hit;
    }
  }
  return hit;
}

// Proyección equirectangular simple: 1° = SCALE px.
const WEST = -119;
const NORTH = 34;
const SCALE = 6;
const WIDTH = (-33 - WEST) * SCALE;
const HEIGHT = (NORTH + 57) * SCALE;
const STEP = 1.55;

function project([lon, lat]: Point): Point {
  return [(lon - WEST) * SCALE, (NORTH - lat) * SCALE];
}

type Dot = { x: number; y: number; tone: 'home' | 'region' | 'faint' };

const DOTS: Dot[] = (() => {
  const dots: Dot[] = [];
  let row = 0;
  for (let lat = NORTH - 1; lat > -57; lat -= STEP * 0.87) {
    const offset = row % 2 === 0 ? 0 : STEP / 2;
    for (let lon = WEST + 1 + offset; lon < -33; lon += STEP) {
      const point: Point = [lon, lat];
      const tone = inside(point, ARGENTINA)
        ? 'home'
        : inside(point, BRAZIL)
          ? 'faint'
          : inside(point, SOUTH_AMERICA) || inside(point, MEXICO_CENTRAL) || inside(point, BAJA)
            ? 'region'
            : null;
      if (tone) {
        const [x, y] = project(point);
        dots.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, tone });
      }
    }
    row += 1;
  }
  for (const point of MALVINAS) {
    const [x, y] = project(point);
    dots.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, tone: 'home' });
  }
  return dots;
})();

const HUB: Point = [-60.5, -32.5];

const MARKERS: { name: string; at: Point; label?: 'left' }[] = [
  { name: 'Brasil', at: [-49, -15] },
  { name: 'Perú', at: [-76, -10], label: 'left' },
  { name: 'Bolivia', at: [-65, -17] },
  { name: 'Paraguay', at: [-57.5, -23.5] },
  { name: 'Chile', at: [-71.3, -33], label: 'left' },
  { name: 'Uruguay', at: [-55.8, -33] },
];

// Sobre fondo claro: Argentina en el azul de marca, el resto en azules suaves.
const DOT_FILL: Record<Dot['tone'], string> = {
  home: '#1f5bff',
  region: '#a9bdf3',
  faint: '#d3ddf8',
};

const INK = '#0b1530';

/** Arco entre el origen y un país, curvado hacia afuera. */
function arc(from: Point, to: Point) {
  const [x1, y1] = project(from);
  const [x2, y2] = project(to);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const bend = 0.22;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx + dy * bend).toFixed(1)} ${(my - dx * bend).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export default function LatamMap({ className = '' }: { className?: string }) {
  const [hubX, hubY] = project(HUB);
  return (
    <svg
      aria-label="Mapa de la red de ATAR en Latinoamérica, con origen en Argentina"
      className={className}
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      {DOTS.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} fill={DOT_FILL[dot.tone]} r={dot.tone === 'home' ? 3 : 2.7} />
      ))}

      {MARKERS.map((marker, index) => (
        <path
          key={marker.name}
          className="animate-draw-line"
          d={arc(HUB, marker.at)}
          fill="none"
          pathLength={220}
          stroke="rgba(11,21,48,0.55)"
          strokeWidth="1.3"
          style={{ animationDelay: `${0.4 + index * 0.18}s` }}
        />
      ))}

      {MARKERS.map((marker) => {
        const [x, y] = project(marker.at);
        const left = marker.label === 'left';
        return (
          <g key={marker.name}>
            <circle cx={x} cy={y} fill="#fff" r="5.5" stroke={INK} strokeWidth="2" />
            <text
              fill={INK}
              fontSize="15"
              fontWeight="600"
              letterSpacing="1.6"
              textAnchor={left ? 'end' : 'start'}
              x={left ? x - 11 : x + 11}
              y={y + 5}
            >
              {marker.name.toUpperCase()}
            </text>
          </g>
        );
      })}

      <text fill={INK} fontSize="11" fontWeight="600" letterSpacing="1.2" x={project(MALVINAS[1])[0] + 10} y={project(MALVINAS[1])[1] + 6}>
        ISLAS MALVINAS
      </text>

      <circle className="animate-map-pulse" cx={hubX} cy={hubY} fill="#3b7bff" r="9" />
      <circle cx={hubX} cy={hubY} fill={INK} r="7" stroke="#fff" strokeWidth="2.5" />
      <text fill={INK} fontSize="15" fontWeight="700" letterSpacing="1.6" x={hubX + 30} y={hubY + 34}>
        ARGENTINA
      </text>
    </svg>
  );
}
