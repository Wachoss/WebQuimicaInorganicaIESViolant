// Química de los compuestos binarios: qué iones pueden formar dos elementos,
// cómo se combinan hasta ser neutros y cómo se nombra el resultado.
// Solo funciones puras (sin tocar la página), para poder probarlas con Node:
// node --test tools/*.test.mjs
//
// Un ion es { simbolo, atomos, carga, valencia }:
//   Fe³⁺  -> { simbolo: 'Fe', atomos: 1, carga: 3,  valencia: 3 }
//   O₂²⁻  -> { simbolo: 'O',  atomos: 2, carga: -2, valencia: 1 }  (peróxido)
//   Hg₂²⁺ -> { simbolo: 'Hg', atomos: 2, carga: 2,  valencia: 1 }  (mercurio(I))
// "carga" es la del ion entero; "valencia" es la de cada átomo, que es la que
// lleva el número romano en la nomenclatura de Stock.

const PREFIJOS = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca', 'undeca', 'dodeca'];
const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// Nombres que no salen de ninguna regla: hay que sabérselos.
const NOMBRES_TRADICIONALES = {
  H2O: ['Agua'],
  H2O2: ['Agua oxigenada'],
  BH3: ['Borano'],
  CH4: ['Metano'],
  SiH4: ['Silano'],
  GeH4: ['Germano'],
  NH3: ['Amoníaco', 'Azano'],
  PH3: ['Fosfano'],
  AsH3: ['Arsano'],
  SbH3: ['Estibano'],
};

export function mcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

const mayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

/**
 * Orden de los elementos en una fórmula binaria (IUPAC 2005, tabla VI):
 * primero el más electropositivo. La secuencia va por grupos (1, 2, 3… 17),
 * con el hidrógeno entre los grupos 15 y 16, y dentro de cada grupo de abajo
 * arriba. Por eso se escribe NaCl, NH3, H2S y también OCl2 (el oxígeno, del
 * grupo 16, va antes que los halógenos).
 * Devuelve un número: cuanto menor, más a la izquierda en la fórmula.
 */
export function posicionEnFormula(elemento) {
  const grupo = elemento.simbolo === 'H' ? 15.5 : elemento.grupo;
  return grupo * 10 - elemento.periodo;
}

const ion = (simbolo, atomos, valencia, signo) => ({ simbolo, atomos, carga: signo * atomos * valencia, valencia });

/**
 * Iones con los que pueden combinarse dos elementos.
 * Devuelve { delante, detras, cationes, aniones, invertir } o { error }.
 * "delante" y "detras" son los elementos en el orden de la fórmula.
 * "invertir" es true cuando el anión se escribe delante (solo pasa con
 * oxígeno + Cl, Br o I: O5Cl2 se forma cruzando Cl⁵⁺ y O²⁻).
 */
export function ionesPosibles(a, b) {
  if (a.simbolo === b.simbolo) return { error: 'mismoElemento' };
  if (a.metal && b.metal) return { error: 'dosMetales' };
  const [delante, detras] = posicionEnFormula(a) < posicionEnFormula(b) ? [a, b] : [b, a];

  // Oxígeno con halógenos: el oxígeno va delante, pero la valencia que se
  // cruza es la del halógeno (como en Cl2O5, que se escribe O5Cl2).
  if (delante.simbolo === 'O') {
    if (!detras.positivas.length) {
      // OF2: el flúor solo tiene -1, así que el oxígeno actúa con +2.
      return { delante, detras, invertir: false, cationes: [ion('O', 1, 2, 1)], aniones: [ion(detras.simbolo, 1, detras.negativa, -1)] };
    }
    return {
      delante, detras, invertir: true,
      cationes: detras.positivas.map((v) => ion(detras.simbolo, 1, v, 1)),
      aniones: [ion('O', 1, 2, -1)],
    };
  }

  if (!delante.positivas.length || !detras.negativa) return { error: 'noCombinan' };

  let valencias = delante.positivas;
  if (detras.simbolo === 'H') {
    // Con hidrógeno, el grupo 15 solo actúa con valencia 3 (NH3, AsH3, BiH3;
    // AsH5 no existe) y el mercurio(I) no forma hidruro (Hg2H2 no existe).
    if (delante.grupo === 15) valencias = valencias.filter((v) => v === 3);
    if (delante.simbolo === 'Hg') valencias = valencias.filter((v) => v !== 1);
  }
  const cationes = valencias.map((v) =>
    // El mercurio(I) no existe como Hg⁺ suelto, sino como Hg₂²⁺: por eso es
    // Hg2Cl2 y no HgCl.
    delante.simbolo === 'Hg' && v === 1 ? ion('Hg', 2, 1, 1) : ion(delante.simbolo, 1, v, 1));
  const aniones = [ion(detras.simbolo, 1, detras.negativa, -1)];
  // Peróxidos: el ion O₂²⁻ con el hidrógeno y los metales de los grupos 1, 2,
  // 11 y 12, que son los que se estudian (Na2O2, BaO2, CuO2, ZnO2, H2O2…).
  if (detras.simbolo === 'O' && [1, 2, 11, 12].includes(delante.grupo)) aniones.push(ion('O', 2, 1, -1));
  return { delante, detras, cationes, aniones, invertir: false };
}

/** Cuántos iones de cada tipo hacen falta, como mínimo, para que sea neutro. */
export function proporcionMinima(cation, anion) {
  const g = mcd(cation.carga, -anion.carga);
  return { nCationes: -anion.carga / g, nAniones: cation.carga / g };
}

/** Comprueba una combinación hecha a mano con fichas. */
export function evaluar(cation, anion, nCationes, nAniones) {
  const positiva = nCationes * cation.carga;
  const negativa = nAniones * -anion.carga;
  const neutro = nCationes > 0 && nAniones > 0 && positiva === negativa;
  return { positiva, negativa, neutro, divisor: neutro ? mcd(nCationes, nAniones) : 1 };
}

const sub = (n) => (n > 1 ? String(n) : '');

/** Fórmula con números normales ("Fe2O3"); la página los pinta como subíndices. */
export function formula(cation, anion, nCationes, nAniones, invertir = false) {
  const parteCation = cation.simbolo + sub(nCationes * cation.atomos);
  const parteAnion = anion.simbolo + sub(nAniones * anion.atomos);
  return invertir ? parteAnion + parteCation : parteCation + parteAnion;
}

/** "Fe2O3" -> [['Fe', 2], ['O', 3]]. Devuelve null si no es un binario simple. */
export function analizarFormula(texto) {
  if (!/^([A-Z][a-z]?\d*){2}$/.test(texto)) return null;
  return [...texto.matchAll(/([A-Z][a-z]?)(\d*)/g)].map(([, s, n]) => [s, n ? Number(n) : 1]);
}

function conPrefijo(n, palabra) {
  const prefijo = PREFIJOS[n === 1 ? 0 : n];
  return prefijo + palabra;
}

/** Variantes que también se aceptan: monóxido, pentóxido… */
function variantesConPrefijo(n, palabra) {
  const variantes = [];
  if (n === 1) variantes.push(('mono' + palabra).replace('monoó', 'monó'));
  if (palabra === 'óxido' && n > 1 && PREFIJOS[n].endsWith('a')) variantes.push(PREFIJOS[n].slice(0, -1) + palabra);
  return variantes;
}

/**
 * El compuesto que forman los iones en la proporción mínima, con sus nombres.
 * elementos: { simbolo -> elemento } (de data/elementos.json).
 * Cada nomenclatura es { nombre, alternativos } o null si no se usa.
 */
export function compuesto(cation, anion, elementos, invertir = false) {
  const { nCationes, nAniones } = proporcionMinima(cation, anion);
  const f = formula(cation, anion, nCationes, nAniones, invertir);
  const peroxido = anion.simbolo === 'O' && anion.atomos === 2;

  // Para nombrar importa el orden escrito: el de detrás acaba en -uro (u óxido)
  // y el de delante va después del "de".
  let [del, nDel, det, nDet] = [cation.simbolo, nCationes * cation.atomos, anion.simbolo, nAniones * anion.atomos];
  if (invertir) [del, nDel, det, nDet] = [det, nDet, del, nDel];
  const delante = elementos[del];
  const detras = elementos[det];
  const palabra = det === 'O' ? 'óxido' : `${detras.raiz}uro`;

  // Sistemática: prefijos en los dos (IUPAC). Si el elemento de delante solo
  // tiene una valencia, no hay ambigüedad y se aceptan también sin prefijos
  // ("óxido de aluminio"), que es como se enseña a menudo.
  const nombre = `${conPrefijo(nDet, palabra)} de ${conPrefijo(nDel, delante.nombre)}`;
  const alternativos = variantesConPrefijo(nDet, palabra).map((p) => `${p} de ${conPrefijo(nDel, delante.nombre)}`);
  const unaValencia = delante.positivas.length === 1 && !invertir;
  if (unaValencia && !peroxido) alternativos.push(`${palabra} de ${delante.nombre}`);
  const sistematica = { nombre: mayuscula(nombre), alternativos: [...new Set(alternativos)].filter((n) => n !== nombre).map(mayuscula) };

  // Stock: número romano con la valencia del de delante, solo si tiene varias.
  // Con oxígeno delante (OCl2, O3Br2…) no se usa.
  let stock = null;
  if (!invertir && del !== 'O') {
    const romano = delante.positivas.length > 1 ? `(${ROMANOS[cation.valencia]})` : '';
    stock = { nombre: mayuscula(`${peroxido ? 'peróxido' : palabra} de ${delante.nombre}${romano}`), alternativos: [] };
  }

  // Tradicional: en binarios solo sobreviven los nombres especiales y los
  // hidrácidos (el compuesto disuelto en agua).
  let tradicional = null;
  if (NOMBRES_TRADICIONALES[f]) {
    const [principal, ...otros] = NOMBRES_TRADICIONALES[f];
    tradicional = { nombre: principal, alternativos: otros };
  } else if (del === 'H' && detras.raizHidracido) {
    tradicional = { nombre: `Ácido ${detras.raizHidracido}hídrico`, alternativos: [], disolucion: true };
  }

  let tipo = 'sales';
  if (peroxido) tipo = 'peroxidos';
  // OF2 no es un óxido sino un fluoruro: el oxígeno es la parte positiva.
  else if (det === 'O' || invertir) tipo = 'oxidos';
  else if (del === 'H' || det === 'H') tipo = 'hidruros';

  const notas = [];
  if (invertir || del === 'O') notas.push('oxigenoDelante');
  if (cation.simbolo === 'Hg' && cation.atomos === 2) notas.push('mercurioI');
  if (peroxido) notas.push('peroxido');

  return { formula: f, tipo, nCationes, nAniones, nombres: { sistematica, stock, tradicional }, notas };
}

/**
 * Busca qué iones dan una fórmula. Sirve para revisar los datos: si una
 * fórmula del test no sale de ninguna combinación, o sale pero con otro
 * nombre, algo está mal. preferirPeroxido desempata casos como PbO2, que
 * puede ser óxido de plomo(IV) o peróxido de plomo(II).
 */
export function deducir(formulaTexto, elementos, preferirPeroxido = false) {
  const partes = analizarFormula(formulaTexto);
  if (!partes) return null;
  const [a, b] = partes.map(([s]) => elementos[s]);
  if (!a || !b) return null;
  const posibles = ionesPosibles(a, b);
  if (posibles.error) return null;
  const encontrados = [];
  for (const c of posibles.cationes) {
    for (const an of posibles.aniones) {
      const resultado = compuesto(c, an, elementos, posibles.invertir);
      if (resultado.formula === formulaTexto) encontrados.push(resultado);
    }
  }
  return encontrados.find((r) => (r.tipo === 'peroxidos') === preferirPeroxido) ?? encontrados[0] ?? null;
}
