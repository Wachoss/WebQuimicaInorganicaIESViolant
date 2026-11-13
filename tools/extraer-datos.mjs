// Extrae los compuestos de las 30 páginas originales (FQv1.1.1/pag) a archivos
// JSON en docs/data/. Solo LEE la versión original: no la modifica.
//
// Uso (desde la raíz del repositorio):  node tools/extraer-datos.mjs
//
// Decisiones:
// - No se usa eval() para leer los arrays: se buscan las cadenas entre comillas
//   con una expresión regular. Así no se ejecuta código del HTML.
// - De cada página se toma la versión "bien escrita" de cada dato:
//     formulación  -> formulaminuscula (fórmula) y nomenclatura (nombre)
//     nomenclatura -> formula (fórmula) y nomenclaturaminuscula (nombre)
//   Las versiones en MAYÚSCULAS solo existían para comparar y ya no hacen falta.
// - Las páginas de formulación y de nomenclatura de una misma sección se unen
//   en un solo archivo: cada compuesto sirve para las dos direcciones. Si las
//   dos páginas no coinciden, manda la de formulación (ver más abajo).
// - Se quitan los espacios sobrantes. El resto de problemas no se corrige aquí:
//   se listan en tools/informe-extraccion.txt para revisarlos a mano.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ORIGEN = 'FQv1.1.1/pag';
const DESTINO = 'docs/data';

// Prefijo del nombre de archivo original -> datos de la sección.
const SISTEMAS = { sist: 'sistematica', stock: 'stock', trad: 'tradicional' };
const TIPOS = {
  binhid: { tipo: 'hidruros', grupo: 'binarios' },
  binoxi: { tipo: 'oxidos', grupo: 'binarios' },
  binsales: { tipo: 'sales', grupo: 'binarios' },
  binpero: { tipo: 'peroxidos', grupo: 'binarios' },
  terhid: { tipo: 'hidroxidos', grupo: 'ternarios' },
  teroxoacidos: { tipo: 'oxoacidos', grupo: 'ternarios' },
  teroxosales: { tipo: 'oxosales', grupo: 'ternarios' },
  tersalesacidas: { tipo: 'sales-acidas', grupo: 'ternarios' },
};

// Correcciones químicas hechas a mano, cada una con su motivo. Se aplican aquí
// en vez de editar el JSON resultante para que, si se vuelve a ejecutar el
// script, no se pierdan y quede constancia de qué se cambió respecto al original.
const CORRECCIONES = JSON.parse(readFileSync('tools/correcciones.json', 'utf8'));
const usadas = new Set();

const informe = [];
const avisar = (pagina, texto) => informe.push(`${pagina}: ${texto}`);

/** Devuelve las cadenas del array `var <nombre> = [ ... ]` de un HTML. */
function leerArray(html, nombre) {
  const inicio = html.match(new RegExp(`var\\s+${nombre}\\s*=\\s*\\[`));
  if (!inicio) return null;
  const desde = inicio.index + inicio[0].length;
  const hasta = html.indexOf(']', desde);
  const cuerpo = html.slice(desde, hasta);
  return [...cuerpo.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

/** Lee una página y devuelve [{formula, nombre}] avisando de lo raro. */
function leerPagina(carpeta, archivo) {
  const pagina = `${carpeta}/${archivo}`;
  const html = readFileSync(join(ORIGEN, carpeta, archivo), 'utf8');
  const esFormulacion = carpeta === 'formulacion';

  let formulas = leerArray(html, esFormulacion ? 'formulaminuscula' : 'formula');
  const nombres = leerArray(html, esFormulacion ? 'nomenclatura' : 'nomenclaturaminuscula');
  // Las versiones en mayúsculas, solo para comprobar que coinciden.
  let comparadas = leerArray(html, esFormulacion ? 'formula' : 'nomenclatura');

  // En alguna página (stockterhid) los dos arrays de fórmulas están cambiados:
  // el de "minúsculas" está en mayúsculas. Nos quedamos con el que tenga minúsculas.
  const todoMayusculas = (lista) => lista.every((f) => f === f.toUpperCase());
  if (esFormulacion && todoMayusculas(formulas) && !todoMayusculas(comparadas)) {
    avisar(pagina, 'los arrays formula y formulaminuscula están intercambiados: el original nunca daba por buena la respuesta');
    [formulas, comparadas] = [comparadas, formulas];
  }

  // Si los arrays no miden lo mismo, los índices no emparejan fórmula y nombre:
  // la página no es fiable y se descarta (la otra dirección cubre la sección).
  const deReferencia = esFormulacion ? formulas : nombres;
  if (formulas.length !== nombres.length || comparadas.length !== deReferencia.length) {
    avisar(pagina, `DESCARTADA: arrays de distinta longitud (fórmulas ${formulas.length}, nombres ${nombres.length}, mayúsculas ${comparadas.length})`);
    return [];
  }

  // El original elegía con Math.round(Math.random()*N): solo se preguntaba del 0 al N.
  const rangos = [...html.matchAll(/^(?!\s*\/[/*]).*Math\.round\(Math\.random\(\)\*(\d+)\)/gm)]
    .map((m) => Number(m[1]))
    .filter((n) => n !== 4); // *4 es el de frases(), no el de los compuestos
  for (const n of new Set(rangos)) {
    if (n !== formulas.length - 1) {
      avisar(pagina, `elegía con Math.random()*${n} pero hay ${formulas.length} compuestos (índices 0-${formulas.length - 1})`);
    }
  }

  const compuestos = [];
  const total = Math.min(formulas.length, nombres.length);
  for (let i = 0; i < total; i++) {
    const formula = formulas[i].trim();
    const nombre = nombres[i].trim().replace(/\s+/g, ' ');
    if (formula !== formulas[i] || nombre !== nombres[i]) {
      avisar(pagina, `espacios sobrantes en ${JSON.stringify(formulas[i])} / ${JSON.stringify(nombres[i])}`);
    }
    const mayus = (comparadas[i] ?? '').trim().replace(/\s+/g, ' ');
    if (mayus !== (esFormulacion ? formula : nombre).toUpperCase()) {
      avisar(pagina, `la versión en mayúsculas no coincide: ${JSON.stringify(comparadas[i])} frente a ${JSON.stringify(esFormulacion ? formulas[i] : nombres[i])}`);
    }
    compuestos.push({ formula, nombre });
  }
  return compuestos;
}

mkdirSync(DESTINO, { recursive: true });
const secciones = new Map();

for (const carpeta of ['formulacion', 'nomenclatura']) {
  for (const [prefijo, sistema] of Object.entries(SISTEMAS)) {
    for (const [clave, datos] of Object.entries(TIPOS)) {
      const archivo = `${prefijo}${clave}${carpeta === 'nomenclatura' ? 'nom' : ''}.html`;
      let compuestos;
      try {
        compuestos = leerPagina(carpeta, archivo);
      } catch (e) {
        if (e.code === 'ENOENT') continue; // esa combinación no existe
        throw e;
      }
      const id = `${datos.tipo}-${sistema}`;
      if (!secciones.has(id)) {
        secciones.set(id, { id, ...datos, sistema, compuestos: [], porFormula: new Map() });
      }
      const seccion = secciones.get(id);
      for (const original of compuestos) {
        const correccion = CORRECCIONES.find((k) => k.seccion === id && k.formula === original.formula && k.nombre === original.nombre);
        if (correccion) usadas.add(correccion);
        if (correccion?.eliminar) continue;
        const c = {
          formula: correccion?.nuevaFormula ?? original.formula,
          nombre: correccion?.nuevoNombre ?? original.nombre,
        };

        // "Amoníaco o azano": dos nombres válidos. El primero es el principal y
        // el resto pasan a alternativos (también se aceptan como respuesta).
        const [nombre, ...otros] = c.nombre.split(' o ');
        const alternativos = otros.map((t) => t.charAt(0).toUpperCase() + t.slice(1));
        alternativos.push(...(correccion?.alternativos ?? []));
        // "Seleniato" es el nombre de la web y "selenato" el que recomienda la
        // IUPAC: se aceptan los dos. Una regla en vez de 18 correcciones sueltas.
        if (nombre.startsWith('Seleniato ')) alternativos.push(nombre.replace('Seleniato', 'Selenato'));

        // La página de formulación manda. En alguna página de nomenclatura los
        // nombres están desplazados una posición respecto a las fórmulas (por
        // ejemplo SnBr4 aparece como "Bromuro de plomo(II)"), así que de ellas
        // solo se toma lo que no contradice a la de formulación, y se avisa del
        // resto para revisarlo a mano.
        const existente = seccion.porFormula.get(c.formula);
        if (existente) {
          if (existente.nombre !== nombre) {
            avisar(`${carpeta}/${archivo}`, `${c.formula} se llama "${nombre}" aquí y "${existente.nombre}" en formulación: no se añade`);
          }
          for (const a of alternativos) {
            if (!existente.alternativos.includes(a)) existente.alternativos.push(a);
          }
          continue;
        }
        if (carpeta === 'nomenclatura') {
          avisar(`${carpeta}/${archivo}`, `${c.formula} ("${nombre}") solo está en la página de nomenclatura: revisar que el nombre corresponde`);
        }
        const nuevo = { formula: c.formula, nombre, alternativos };
        seccion.porFormula.set(c.formula, nuevo);
        seccion.compuestos.push(nuevo);
      }
    }
  }
}

for (const k of CORRECCIONES.filter((k) => !usadas.has(k))) {
  avisar('tools/correcciones.json', `corrección sin aplicar (no se encontró ${k.formula} "${k.nombre}" en ${k.seccion})`);
}

const indice = [];
for (const s of secciones.values()) {
  const { porFormula, ...datos } = s;
  writeFileSync(join(DESTINO, `${s.id}.json`), JSON.stringify(datos, null, 2) + '\n');
  indice.push({ id: s.id, tipo: s.tipo, grupo: s.grupo, sistema: s.sistema, total: s.compuestos.length });
  console.log(`${s.id}.json: ${s.compuestos.length} compuestos`);
}
writeFileSync(join(DESTINO, 'indice.json'), JSON.stringify(indice, null, 2) + '\n');
writeFileSync('tools/informe-extraccion.txt', informe.join('\n') + '\n');
console.log(`\n${informe.length} avisos en tools/informe-extraccion.txt`);
