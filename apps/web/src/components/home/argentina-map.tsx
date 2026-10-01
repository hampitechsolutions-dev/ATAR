import { ARGENTINA, inside, type Point } from './latam-map';

/**
 * Mapa de puntos de Argentina (con las Islas Malvinas) para el directorio de
 * proveedores: cada ciudad con empresas es un marcador que filtra el listado.
 */

const WEST = -75;
const NORTH = -20.5;
const SCALE = 14;
// Margen a la derecha para que entren los nombres de las ciudades del este.
const LABEL_SPACE = 130;
const WIDTH = (-52 - WEST) * SCALE + LABEL_SPACE;
const HEIGHT = (NORTH + 56.5) * SCALE;
const STEP = 0.78;

function project([lon, lat]: Point): Point {
  return [(lon - WEST) * SCALE, (NORTH - lat) * SCALE];
}

const DOTS: Point[] = (() => {
  const dots: Point[] = [];
  let row = 0;
  for (let lat = NORTH - 0.5; lat > -56; lat -= STEP * 0.87) {
    const offset = row % 2 === 0 ? 0 : STEP / 2;
    for (let lon = WEST + 0.5 + offset; lon < -52; lon += STEP) {
      if (inside([lon, lat], ARGENTINA)) {
        dots.push(project([lon, lat]));
      }
    }
    row += 1;
  }
  const [mx, my] = [-59.6, -51.75];
  for (const [dx, dy] of [[-0.8, 0], [0, 0], [0.8, 0], [-0.4, -0.68], [0.4, 0.68]]) {
    dots.push(project([mx + dx, my + dy]));
  }
  return dots;
})();

// Ubicación (longitud, latitud) de las ciudades y provincias más habituales.
// Una ciudad que no esté acá aparece en la lista pero no en el mapa.
const CITIES: Record<string, Point> = {
  'buenos aires': [-58.4, -34.6],
  caba: [-58.4, -34.6],
  'la plata': [-57.95, -34.92],
  rosario: [-60.65, -32.95],
  'santa fe': [-60.7, -31.63],
  cordoba: [-64.18, -31.42],
  mendoza: [-68.83, -32.89],
  'san juan': [-68.52, -31.54],
  'san luis': [-66.34, -33.3],
  tucuman: [-65.22, -26.82],
  'san miguel de tucuman': [-65.22, -26.82],
  salta: [-65.41, -24.79],
  jujuy: [-65.3, -24.19],
  resistencia: [-58.99, -27.45],
  chaco: [-58.99, -27.45],
  corrientes: [-58.83, -27.47],
  posadas: [-55.9, -27.37],
  misiones: [-55.9, -27.37],
  parana: [-60.52, -31.73],
  'entre rios': [-59.2, -32],
  colon: [-58.14, -32.22],
  neuquen: [-68.06, -38.95],
  'bahia blanca': [-62.27, -38.72],
  'mar del plata': [-57.55, -38],
  'la pampa': [-64.29, -36.62],
  'santa rosa': [-64.29, -36.62],
  bariloche: [-71.3, -41.13],
  'rio negro': [-67.5, -40],
  chubut: [-67.5, -43.5],
  'comodoro rivadavia': [-67.5, -45.86],
  'rio gallegos': [-69.22, -51.62],
  'santa cruz': [-69.5, -49],
  ushuaia: [-68.3, -54.8],
  'tierra del fuego': [-68, -54],
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export default function ArgentinaMap({
  cities,
  onSelect,
  selected,
  className = '',
}: {
  cities: { name: string; count: number }[];
  onSelect: (city: string) => void;
  /** Ciudad activa en el filtro, para resaltar su marcador. */
  selected?: string;
  className?: string;
}) {
  const [malvinasX, malvinasY] = project([-58.6, -51.75]);
  return (
    <svg aria-label="Mapa de proveedores en Argentina" className={className} role="img" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {DOTS.map(([x, y]) => (
        <circle key={`${x.toFixed(1)}-${y.toFixed(1)}`} cx={x} cy={y} fill="#a9bdf3" r="3.4" />
      ))}
      <text fill="#5b6b93" fontSize="11" fontWeight="600" letterSpacing="1" x={malvinasX + 6} y={malvinasY + 4}>
        ISLAS MALVINAS
      </text>

      {cities.map((city, index) => {
        const at = CITIES[normalize(city.name)];
        if (!at) {
          return null;
        }
        const [x, y] = project(at);
        const active = selected === city.name;
        return (
          <g
            key={city.name}
            className="cursor-pointer"
            onClick={() => onSelect(city.name)}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ' ? onSelect(city.name) : undefined)}
            role="button"
            tabIndex={0}
          >
            <title>{`${city.name} (${city.count})`}</title>
            <circle className="animate-map-pulse" cx={x} cy={y} fill="#1f5bff" r="11" style={{ animationDelay: `${(index * 400) % 2400}ms` }} />
            <circle cx={x} cy={y} fill={active ? '#0b1530' : '#1f5bff'} r="8" stroke="#fff" strokeWidth="2.5" />
            <text fill="#0b1530" fontSize="13" fontWeight="700" letterSpacing="0.6" x={x + 14} y={y + 4.5}>
              {city.name.toUpperCase()}
              <tspan fill="#5b6b93" fontWeight="500">{` · ${city.count}`}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}
