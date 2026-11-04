// Pruebas del constructor de compuestos. Ejecutar con:  node --test tools/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ionesPosibles, proporcionMinima, evaluar, compuesto, deducir, analizarFormula } from '../docs/js/quimica.js';

const datos = JSON.parse(readFileSync(new URL('../docs/data/elementos.json', import.meta.url)));
const elementos = Object.fromEntries(datos.elementos.map((e) => [e.simbolo, e]));

/** Construye el compuesto de dos elementos con las valencias dadas. */
function construir(a, b, { valencia, peroxido = false } = {}) {
  const p = ionesPosibles(elementos[a], elementos[b]);
  assert.ok(!p.error, `${a}+${b}: ${p.error}`);
  const cation = valencia ? p.cationes.find((c) => c.valencia === valencia) : p.cationes[0];
  const anion = p.aniones[peroxido ? 1 : 0];
  return compuesto(cation, anion, elementos, p.invertir);
}

test('cruza valencias y simplifica', () => {
  assert.equal(construir('Fe', 'O', { valencia: 3 }).formula, 'Fe2O3');
  assert.equal(construir('Fe', 'O', { valencia: 2 }).formula, 'FeO'); // Fe2O2 se simplifica
  assert.equal(construir('Pb', 'O', { valencia: 4 }).formula, 'PbO2');
  assert.equal(construir('Mn', 'O', { valencia: 7 }).formula, 'Mn2O7');
  assert.equal(construir('Ca', 'N').formula, 'Ca3N2');
});

test('da igual el orden en que se eligen los elementos', () => {
  assert.equal(construir('Cl', 'Na').formula, 'NaCl');
  assert.equal(construir('S', 'H').formula, 'H2S');
  assert.equal(construir('H', 'N', { valencia: 3 }).formula, 'NH3');
});

test('orden IUPAC: el oxígeno va delante de Cl, Br, I y F', () => {
  const o5cl2 = construir('Cl', 'O', { valencia: 5 });
  assert.equal(o5cl2.formula, 'O5Cl2');
  assert.equal(o5cl2.nombres.sistematica.nombre, 'Dicloruro de pentaoxígeno');
  assert.equal(o5cl2.nombres.stock, null);
  assert.equal(construir('F', 'O').formula, 'OF2');
});

test('peróxidos: el ion O₂²⁻ no se rompe al simplificar', () => {
  assert.equal(construir('Na', 'O', { peroxido: true }).formula, 'Na2O2');
  assert.equal(construir('Ba', 'O', { peroxido: true }).formula, 'BaO2');
  const h2o2 = construir('H', 'O', { peroxido: true });
  assert.equal(h2o2.formula, 'H2O2');
  assert.equal(h2o2.nombres.tradicional.nombre, 'Agua oxigenada');
  assert.equal(ionesPosibles(elementos.S, elementos.O).aniones.length, 1); // sin peróxido con no metales
});

test('mercurio(I) es Hg₂²⁺', () => {
  const hg2cl2 = construir('Hg', 'Cl', { valencia: 1 });
  assert.equal(hg2cl2.formula, 'Hg2Cl2');
  assert.equal(hg2cl2.nombres.stock.nombre, 'Cloruro de mercurio(I)');
  assert.equal(hg2cl2.nombres.sistematica.nombre, 'Dicloruro de dimercurio');
});

test('nombres sistemáticos con prefijos y sus variantes', () => {
  const n2o5 = construir('N', 'O', { valencia: 5 }).nombres.sistematica;
  assert.equal(n2o5.nombre, 'Pentaóxido de dinitrógeno');
  assert.ok(n2o5.alternativos.includes('Pentóxido de dinitrógeno'));
  const co = construir('C', 'O', { valencia: 2 }).nombres.sistematica;
  assert.equal(co.nombre, 'Óxido de carbono');
  assert.ok(co.alternativos.includes('Monóxido de carbono'));
  const al2o3 = construir('Al', 'O').nombres.sistematica;
  assert.equal(al2o3.nombre, 'Trióxido de dialuminio');
  assert.ok(al2o3.alternativos.includes('Óxido de aluminio')); // una sola valencia: sin ambigüedad
  assert.ok(!construir('Fe', 'O', { valencia: 3 }).nombres.sistematica.alternativos.includes('Óxido de hierro'));
});

test('Stock solo pone el número romano si hay varias valencias', () => {
  assert.equal(construir('Fe', 'O', { valencia: 3 }).nombres.stock.nombre, 'Óxido de hierro(III)');
  assert.equal(construir('Na', 'Cl').nombres.stock.nombre, 'Cloruro de sodio');
  assert.equal(construir('Cu', 'O', { valencia: 2, peroxido: true }).nombres.stock.nombre, 'Peróxido de cobre(II)');
});

test('tradicional: nombres especiales e hidrácidos', () => {
  assert.equal(construir('N', 'H', { valencia: 3 }).nombres.tradicional.nombre, 'Amoníaco');
  assert.equal(construir('H', 'Cl').nombres.tradicional.nombre, 'Ácido clorhídrico');
  assert.equal(construir('H', 'S').nombres.tradicional.nombre, 'Ácido sulfhídrico');
  assert.equal(construir('Fe', 'O', { valencia: 3 }).nombres.tradicional, null);
});

test('combinaciones imposibles', () => {
  assert.equal(ionesPosibles(elementos.Fe, elementos.Cu).error, 'dosMetales');
  assert.equal(ionesPosibles(elementos.O, elementos.O).error, 'mismoElemento');
});

test('evaluar: neutro, no neutro y simplificable', () => {
  const p = ionesPosibles(elementos.Fe, elementos.O);
  const fe3 = p.cationes.find((c) => c.valencia === 3);
  const o = p.aniones[0];
  assert.deepEqual(proporcionMinima(fe3, o), { nCationes: 2, nAniones: 3 });
  assert.equal(evaluar(fe3, o, 1, 1).neutro, false);
  assert.deepEqual(evaluar(fe3, o, 2, 3), { positiva: 6, negativa: 6, neutro: true, divisor: 1 });
  assert.equal(evaluar(fe3, o, 4, 6).divisor, 2);
});

test('deducir: de la fórmula a los iones', () => {
  assert.equal(deducir('Fe2O3', elementos).nombres.stock.nombre, 'Óxido de hierro(III)');
  assert.equal(deducir('PbO2', elementos).tipo, 'oxidos');
  assert.equal(deducir('PbO2', elementos, true).tipo, 'oxidos'); // el plomo no forma peróxidos
  assert.equal(deducir('BaO2', elementos, true).tipo, 'peroxidos');
  assert.equal(deducir('HgH', elementos), null); // el mercurio(I) daría Hg2H2
  assert.equal(analizarFormula('H2SO4'), null);
});
