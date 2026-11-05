// Verifica los compuestos ternarios y cuaternarios del test (hidróxidos,
// oxoácidos, oxosales y sales ácidas) en sentido contrario al de los datos:
// lee el NOMBRE guardado, construye la fórmula que le corresponde con las
// reglas de formulación y la compara con la FÓRMULA guardada.
// Si no coinciden, o el nombre no se puede formular con las valencias de la
// tabla, se apunta para revisarlo a mano. No corrige nada.
//
// Los binarios ya los revisa tools/comparar-constructor.mjs (en el otro
// sentido: fórmula -> nombre). Entre los dos scripts se cubren todas las
// secciones.
//
// Uso (desde la raíz del repositorio):  node tools/verificar-ternarios.mjs
// Escribe el informe en tools/informe-ternarios.txt

import { readFileSync, writeFileSync } from 'node:fs';

const DATOS = 'docs/data';
const leer = (ruta) => JSON.parse(readFileSync(`${DATOS}/${ruta}`, 'utf8'));
const elementos = leer('elementos.json').elementos;
const porNombre = Object.fromEntries(elementos.map((e) => [e.nombre, e]));
const porSimbolo = Object.fromEntries(elementos.map((e) => [e.simbolo, e]));

const ROMANOS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const PREFIJOS = { mono: 1, di: 2, tri: 3, tetra: 4, penta: 5, hexa: 6 };
const mcd = (a, b) => (b ? mcd(b, a % b) : a);
const sub = (n) => (n > 1 ? String(n) : '');

/** Quita tildes y pasa a minúsculas, para comparar raíces de nombres. */
const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ---------------------------------------------------------------------------
// Oxoácidos: se generan con las reglas que se enseñan en bachillerato, a
// partir de las valencias positivas de la tabla (no de los datos del test,
// para que la comprobación sea independiente).
//
//   óxido + agua:  X2Ov + H2O  ->  H2X2O(v+1)  ->  se simplifica
//   P, As, Sb y B: orto (óxido + 3 H2O), como H3PO4 o H3BO3
//   Si: orto, H4SiO4
//   Cr y Mn: solo las valencias altas forman ácidos (crómico, mangánico...)
//
// Prefijos y sufijos según cuántas valencias forman ácido:
//   1 -> -ico · 2 -> -oso, -ico · 3 -> hipo-oso, -oso, -ico
//   4 -> hipo-oso, -oso, -ico, per-ico
// ---------------------------------------------------------------------------

// Raíz del nombre del ácido de cada elemento (sin tildes).
const RAIZ_ACIDO = {
  B: 'bor', C: 'carbon', Si: 'silic', N: 'nitr', P: 'fosfor', As: 'arsen', Sb: 'antimon',
  S: 'sulfur', Se: 'seleni', Te: 'telur', Cl: 'clor', Br: 'brom', I: 'yod', Cr: 'crom', Mn: 'mangan',
};
// En -ico algunas raíces cambian: selénico (no seleniico), fosfórico, sulfúrico.
const RAIZ_ICO = { Se: 'selen' };
// En las sales la raíz se acorta: fosfato (no fosforato), sulfato (no sulfurato).
// Para el selenio se aceptan "selenato" (IUPAC) y "seleniato" (muy usado).
const RAIZ_SAL = { P: ['fosf'], S: ['sulf'], Se: ['selen', 'seleni'] };
// Valencias que forman oxoácido (si no se dice, todas las positivas de la tabla).
const VALENCIAS_ACIDO = { N: [1, 3, 5], Cr: [6], Mn: [6, 7] };
const ORTO = { P: 3, As: 3, Sb: 3, B: 3, Si: 4 };
// Valencia -> [prefijo, sufijo] según cuántas haya.
const NOMBRES_POR_CANTIDAD = {
  1: [['', 'ico']],
  2: [['', 'oso'], ['', 'ico']],
  3: [['hipo', 'oso'], ['', 'oso'], ['', 'ico']],
  4: [['hipo', 'oso'], ['', 'oso'], ['', 'ico'], ['per', 'ico']],
};
// Mn: mangánico (VI) y permangánico (VII), no "manganoso/mangánico".
const NOMBRES_ESPECIALES = { Mn: [['', 'ico'], ['per', 'ico']] };

/** Lista de oxoácidos: { simbolo, valencia, h, x, o, nombre, anion, carga } */
function generarOxoacidos() {
  const lista = [];
  for (const simbolo of Object.keys(RAIZ_ACIDO)) {
    const el = porSimbolo[simbolo];
    const valencias = VALENCIAS_ACIDO[simbolo] ?? el.positivas;
    const nombres = NOMBRES_ESPECIALES[simbolo] ?? NOMBRES_POR_CANTIDAD[valencias.length];
    valencias.forEach((v, i) => {
      let h, x, o;
      if (ORTO[simbolo]) {
        h = ORTO[simbolo]; x = 1; o = (v + h) / 2;
      } else {
        // Valencia par: XO(v/2) + H2O = H2XO(v/2+1)
        // Valencia impar: X2Ov + H2O = H2X2O(v+1) -> se simplifica a HXO((v+1)/2)
        [h, x, o] = v % 2 === 0 ? [2, 1, v / 2 + 1] : [1, 1, (v + 1) / 2];
      }
      const [prefijo, sufijo] = nombres[i];
      const raiz = sufijo === 'ico' ? (RAIZ_ICO[simbolo] ?? RAIZ_ACIDO[simbolo]) : RAIZ_ACIDO[simbolo];
      const raicesSal = (RAIZ_SAL[simbolo] ?? [RAIZ_ACIDO[simbolo]]).map((r) => prefijo + r);
      lista.push({ simbolo, valencia: v, h, x, o, raiz: prefijo + raiz, raicesSal, sufijo });
    });
  }
  // Ácido dicrómico: 2 H2CrO4 - H2O
  lista.push({ simbolo: 'Cr', valencia: 6, h: 2, x: 2, o: 7, raiz: 'dicrom', raicesSal: ['dicrom'], sufijo: 'ico' });
  return lista;
}

const OXOACIDOS = generarOxoacidos();

/** Grupo del anión escrito como en la web: "SO4", "Cr2O7", "HPO4", "H2PO3". */
const grupoAnion = (a, hRestantes = 0) => `${hRestantes ? 'H' + sub(hRestantes) : ''}${a.simbolo}${sub(a.x)}O${sub(a.o)}`;

// Aniones por nombre sin tildes: "sulfato" -> { grupo: "SO4", carga: 2 }.
const ANIONES = { cianuro: { grupo: 'CN', carga: 1 } };
for (const a of OXOACIDOS) {
  for (const raiz of a.raicesSal) {
    ANIONES[raiz + (a.sufijo === 'oso' ? 'ito' : 'ato')] = { grupo: grupoAnion(a), carga: a.h, acido: a };
  }
}
// Ácidos por nombre: "acido sulfurico" -> "H2SO4".
const ACIDOS = { 'acido cianhidrico': 'HCN' };
for (const a of OXOACIDOS) ACIDOS[`acido ${a.raiz}${a.sufijo}`] = `H${sub(a.h)}${a.simbolo}${sub(a.x)}O${sub(a.o)}`;

// ---------------------------------------------------------------------------
// Catión: "hierro(III)", "sodio", "cobre"...
// ---------------------------------------------------------------------------

/** Devuelve { el, valencia, avisos } o { error }. */
function leerCation(texto, { stock }) {
  const m = texto.match(/^(.+?)\s*(?:\(([IVX]+)\))?$/);
  const el = porNombre[m[1].trim().toLowerCase()];
  if (!el) return { error: `"${m[1]}" no es un elemento de la tabla` };
  if (!el.metal) return { error: `${el.nombre} no es un metal: este compuesto no es un hidróxido ni una sal` };
  const avisos = [];
  let valencia = m[2] ? ROMANOS[m[2]] : null;
  if (valencia && !el.positivas.includes(valencia)) return { error: `${el.nombre} no tiene valencia ${valencia} en la tabla` };
  if (stock) {
    if (!valencia && el.positivas.length > 1) return { error: `falta el número romano: ${el.nombre} tiene valencias ${el.positivas.join(', ')}` };
    if (valencia && el.positivas.length === 1) avisos.push(`sobra el número romano: ${el.nombre} solo tiene valencia ${valencia}`);
  }
  if (!valencia && el.positivas.length === 1) valencia = el.positivas[0];
  return { el, valencia, avisos };
}

/** Fórmula de una sal: catión con valencia v y anión de carga c. */
function sal(simbolo, v, grupo, c) {
  const g = mcd(v, c);
  const [nCat, nAn] = [c / g, v / g];
  const anion = nAn > 1 ? `(${grupo})${nAn}` : grupo;
  return `${simbolo}${sub(nCat)}${anion}`;
}

// ---------------------------------------------------------------------------
// Un formulador por tipo de nombre. Cada uno devuelve
// { formula, avisos } o { error }.
// ---------------------------------------------------------------------------

function formularHidroxido(nombre, sistema) {
  const m = nombre.match(/^(mono|di|tri|tetra|penta|hexa)?hidr[oó]xido de (.+)$/i);
  if (!m) return { error: 'no se reconoce como hidróxido' };
  const stock = sistema === 'stock';
  if (stock && m[1]) return { error: 'en Stock no se usan prefijos' };
  const cat = leerCation(m[2], { stock });
  if (cat.error) return cat;
  let n;
  if (stock) n = cat.valencia;
  else if (m[1]) n = PREFIJOS[m[1].toLowerCase()];
  else if (cat.el.positivas.length === 1) n = cat.el.positivas[0];
  else n = 1; // "hidróxido de cobre" = monohidróxido
  if (!stock && /\(/.test(m[2])) return { error: 'en sistemática no se usa número romano' };
  if (!cat.el.positivas.includes(n)) return { error: `${cat.el.nombre} no tiene valencia ${n} en la tabla` };
  const formula = n > 1 ? `${cat.el.simbolo}(OH)${n}` : `${cat.el.simbolo}OH`;
  return { formula, avisos: cat.avisos };
}

function formularOxoacido(nombre) {
  const formula = ACIDOS[plano(nombre)];
  return formula ? { formula, avisos: [] } : { error: 'no sale de las reglas con las valencias de la tabla' };
}

function formularOxosal(nombre) {
  const m = nombre.match(/^(\S+) de (.+)$/);
  if (!m) return { error: 'no se reconoce' };
  const anion = ANIONES[plano(m[1])];
  if (!anion) return { error: `anión "${m[1]}" desconocido (no sale de un oxoácido de la tabla)` };
  const cat = leerCation(m[2], { stock: true });
  if (cat.error) return cat;
  return { formula: sal(cat.el.simbolo, cat.valencia, anion.grupo, anion.carga), avisos: cat.avisos };
}

function formularSalAcida(nombre) {
  const m = nombre.match(/^(di)?hidr[oó]geno(\S+) de (.+)$/i);
  if (!m) return { error: 'no empieza por hidrogeno- o dihidrogeno-' };
  const nH = m[1] ? 2 : 1;
  const anion = ANIONES[plano(m[2])];
  if (!anion?.acido) return { error: `anión "${m[2]}" desconocido` };
  const carga = anion.carga - nH;
  if (carga < 1) return { error: `el ácido solo tiene ${anion.carga} H: no queda carga para el metal` };
  const cat = leerCation(m[3], { stock: true });
  if (cat.error) return cat;
  return { formula: sal(cat.el.simbolo, cat.valencia, grupoAnion(anion.acido, nH), carga), avisos: cat.avisos };
}

const FORMULADORES = {
  hidroxidos: formularHidroxido,
  oxoacidos: formularOxoacido,
  oxosales: formularOxosal,
  'sales-acidas': formularSalAcida,
};

// El mercurio(I) es Hg₂²⁺. La web escribe HgOH, HgNO3... (simplificación
// escolar); el constructor de binarios usa Hg2Cl2. Se acepta la forma Hg2 como
// equivalente y se avisa aparte, porque es una decisión de criterio.
function variantesMercurioI(formula) {
  if (!/^Hg(?![a-z])/.test(formula)) return [];
  return [formula.replace(/^Hg(\d*)/, (_, n) => `Hg${(Number(n || 1)) * 2}`)];
}

// ---------------------------------------------------------------------------

const secciones = leer('indice.json').filter((s) => s.grupo !== 'binarios');
const lineas = [];
let revisados = 0;
let correctos = 0;
let problemas = 0;

for (const { id, tipo, sistema } of secciones) {
  const formular = FORMULADORES[tipo];
  const avisos = [];
  for (const c of leer(`${id}.json`).compuestos) {
    revisados++;
    const nombres = [c.nombre, ...c.alternativos];
    let bien = true;
    for (const nombre of nombres) {
      const r = formular(nombre, sistema);
      const etiqueta = nombre === c.nombre ? '' : ' (alternativo)';
      if (r.error) {
        avisos.push(`  ${c.formula}  "${nombre}"${etiqueta}: ${r.error}`);
        bien = false;
        continue;
      }
      for (const a of r.avisos) avisos.push(`  ${c.formula}  "${nombre}"${etiqueta}: ${a}`);
      if (r.formula !== c.formula) {
        const hg = c.formula.startsWith('Hg') && variantesMercurioI(c.formula).length && /mercurio\(I\)$/.test(nombre);
        avisos.push(`  ${c.formula}  "${nombre}"${etiqueta}  ->  el nombre corresponde a ${r.formula}${hg ? ' (mercurio(I) escrito sin Hg2)' : ''}`);
        bien = false;
      }
      if (r.avisos.length) bien = false;
    }
    if (bien) correctos++;
  }
  problemas += avisos.length;
  lineas.push(`== ${id} (${avisos.length} para revisar)`, ...avisos, '');
}

const cabecera = [
  'Verificación de ternarios y cuaternarios: del nombre guardado a la fórmula.',
  `Revisados: ${revisados} · correctos: ${correctos} · avisos: ${problemas}`,
  'Cada aviso puede ser un error en los datos o un nombre válido que las reglas del script no conocen: hay que mirarlo a mano.',
  '',
];
writeFileSync('tools/informe-ternarios.txt', [...cabecera, ...lineas].join('\n'));
console.log(cabecera[1]);
