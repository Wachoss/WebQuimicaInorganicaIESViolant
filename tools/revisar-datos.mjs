// Revisa los JSON de docs/data/ y lista los datos sospechosos para revisarlos
// a mano. No corrige nada: la química la decide una persona.
//
// Uso (desde la raíz del repositorio):  node tools/revisar-datos.mjs
//
// Qué busca:
// 1. Una fórmula con varios nombres distintos en la misma sección.
// 2. Un nombre con varias fórmulas distintas en la misma sección
//    (ej.: "Hidruro de mercurio" con HgH y HgH2). Se permite X y X(aq).
// 3. Fórmulas que no se pueden leer como símbolos de elementos reales
//    (ej.: "Rh" sí, "Ox" no) o con paréntesis sin cerrar.
// 4. Espacios sobrantes y nombres que no empiezan por mayúscula.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATOS = 'docs/data';

// Símbolos de los 118 elementos.
const ELEMENTOS = new Set(`H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co
Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd
Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np
Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og`.split(/\s+/));

/** Devuelve un texto con el problema de la fórmula, o null si se puede leer. */
function problemaFormula(formula) {
  if (formula !== formula.trim()) return 'espacios sobrantes';
  formula = formula.replace(/\(aq\)$/, ''); // disolución acuosa: HCl(aq)
  let profundidad = 0;
  // Trozos posibles: símbolo (mayúscula + minúscula opcional), número o paréntesis.
  for (const trozo of formula.match(/[A-Z][a-z]?|\d+|[()]|./g) ?? []) {
    if (trozo === '(') profundidad++;
    else if (trozo === ')') profundidad--;
    else if (/^\d+$/.test(trozo)) continue;
    else if (!ELEMENTOS.has(trozo)) return `"${trozo}" no es un símbolo de elemento`;
    if (profundidad < 0) return 'paréntesis sin abrir';
  }
  return profundidad === 0 ? null : 'paréntesis sin cerrar';
}

/** Agrupa los compuestos por `clave` y devuelve los grupos con valores distintos. */
function conflictos(compuestos, clave, valor) {
  const grupos = new Map();
  for (const c of compuestos) {
    if (!grupos.has(c[clave])) grupos.set(c[clave], new Set());
    grupos.get(c[clave]).add(c[valor]);
  }
  return [...grupos].filter(([, valores]) => valores.size > 1);
}

let total = 0;
for (const archivo of readdirSync(DATOS).filter((f) => f.endsWith('.json') && !['indice.json', 'elementos.json'].includes(f)).sort()) {
  const { compuestos } = JSON.parse(readFileSync(join(DATOS, archivo), 'utf8'));
  const avisos = [];

  for (const [formula, nombres] of conflictos(compuestos, 'formula', 'nombre')) {
    avisos.push(`${formula} tiene varios nombres: ${[...nombres].join(' | ')}`);
  }
  for (const [nombre, formulas] of conflictos(compuestos, 'nombre', 'formula')) {
    // HCl y HCl(aq) con el mismo nombre es intencionado: el motor acepta las dos.
    if (new Set([...formulas].map((f) => f.replace(/\(aq\)$/, ''))).size === 1) continue;
    avisos.push(`"${nombre}" tiene varias fórmulas: ${[...formulas].join(' | ')}`);
  }
  for (const { formula, nombre } of compuestos) {
    const problema = problemaFormula(formula);
    if (problema) avisos.push(`fórmula ${JSON.stringify(formula)} (${nombre}): ${problema}`);
    if (nombre !== nombre.trim() || /\s{2}/.test(nombre)) avisos.push(`espacios sobrantes en "${nombre}"`);
    if (nombre[0] !== nombre[0].toUpperCase()) avisos.push(`"${nombre}" no empieza por mayúscula`);
  }

  if (avisos.length) {
    console.log(`\n## ${archivo} (${avisos.length})`);
    for (const a of avisos) console.log(`- ${a}`);
  }
  total += avisos.length;
}
console.log(`\nTotal: ${total} avisos`);
