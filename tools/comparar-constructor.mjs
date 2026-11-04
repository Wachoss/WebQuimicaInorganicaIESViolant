// Compara los compuestos binarios del test con lo que genera el constructor
// (docs/js/quimica.js). Si una fórmula del test no se puede construir con las
// valencias de la tabla, o el nombre guardado no coincide con ninguno de los
// que genera el constructor, se apunta para revisarlo a mano.
// No corrige nada: la química la decide una persona.
//
// Uso (desde la raíz del repositorio):  node tools/comparar-constructor.mjs
// Escribe el informe en tools/informe-constructor.txt

import { readFileSync, writeFileSync } from 'node:fs';
import { deducir } from '../docs/js/quimica.js';
import { normalizarNombre } from '../docs/js/correccion.js';

const DATOS = 'docs/data';
const leer = (ruta) => JSON.parse(readFileSync(`${DATOS}/${ruta}`, 'utf8'));
const elementos = Object.fromEntries(leer('elementos.json').elementos.map((e) => [e.simbolo, e]));
const secciones = leer('indice.json').filter((s) => s.grupo === 'binarios');

const lineas = [];
let revisados = 0;
let coinciden = 0;
let problemas = 0;

for (const { id, tipo, sistema } of secciones) {
  const avisos = [];
  for (const c of leer(`${id}.json`).compuestos) {
    if (c.formula.endsWith('(aq)')) continue; // mismo nombre que sin (aq)
    revisados++;
    const generado = deducir(c.formula, elementos, tipo === 'peroxidos');
    if (!generado) {
      avisos.push(`  ${c.formula}  "${c.nombre}": no sale con las valencias de la tabla`);
      continue;
    }
    const nombres = generado.nombres[sistema];
    if (!nombres) {
      avisos.push(`  ${c.formula}  "${c.nombre}": el constructor no da nombre ${sistema} para este compuesto`);
      continue;
    }
    const validos = [nombres.nombre, ...nombres.alternativos].map(normalizarNombre);
    if (validos.includes(normalizarNombre(c.nombre))) {
      coinciden++;
    } else {
      avisos.push(`  ${c.formula}  "${c.nombre}"  ->  el constructor dice "${nombres.nombre}"`);
    }
  }
  problemas += avisos.length;
  lineas.push(`== ${id} (${avisos.length} para revisar)`, ...avisos, '');
}

const cabecera = [
  'Comparación entre los compuestos binarios del test y el constructor.',
  `Revisados: ${revisados} · coinciden: ${coinciden} · para revisar: ${problemas}`,
  'Cada aviso puede ser un error en los datos o un nombre válido que el constructor no conoce: hay que mirarlo a mano.',
  '',
];
writeFileSync('tools/informe-constructor.txt', [...cabecera, ...lineas].join('\n'));
console.log(cabecera[1]);
