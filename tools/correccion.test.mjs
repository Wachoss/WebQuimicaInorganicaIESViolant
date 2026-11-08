// Pruebas de la corrección y de la batería. Ejecutar con:  node --test tools/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esCorrecta, normalizarNombre } from '../docs/js/correccion.js';
import { crearBateria, barajar, Test } from '../docs/js/bateria.js';

const coo = { formula: 'CoO', nombre: 'Óxido de cobalto(II)', alternativos: [] };
const hcl = { formula: 'HCl', nombre: 'Ácido clorhídrico', alternativos: [] };
const hclAq = { formula: 'HCl(aq)', nombre: 'Ácido clorhídrico', alternativos: [] };
const nh3 = { formula: 'NH3', nombre: 'Amoníaco', alternativos: ['Azano'] };
const formular = (compuesto) => ({ modo: 'formulacion', compuesto });
const nombrar = (compuesto) => ({ modo: 'nomenclatura', compuesto });

test('fórmulas: respeta mayúsculas e ignora espacios', () => {
  assert.equal(esCorrecta(formular(coo), 'CoO', [coo]), true);
  assert.equal(esCorrecta(formular(coo), ' Co O ', [coo]), true);
  assert.equal(esCorrecta(formular(coo), 'COO', [coo]), false);
  assert.equal(esCorrecta(formular(coo), 'coo', [coo]), false);
});

test('fórmulas: acepta subíndices Unicode', () => {
  assert.equal(esCorrecta(formular(nh3), 'NH₃', [nh3]), true);
});

test('fórmulas: si dos compuestos se llaman igual, vale cualquiera', () => {
  assert.equal(esCorrecta(formular(hcl), 'HCl(aq)', [hcl, hclAq]), true);
  assert.equal(esCorrecta(formular(hclAq), 'HCl', [hcl, hclAq]), true);
});

test('nombres: ignora mayúsculas, tildes y espacios', () => {
  assert.equal(esCorrecta(nombrar(coo), 'oxido de cobalto(II)', [coo]), true);
  assert.equal(esCorrecta(nombrar(coo), '  ÓXIDO  DE COBALTO (II) ', [coo]), true);
  assert.equal(esCorrecta(nombrar(coo), 'Óxido de cobalto(III)', [coo]), false);
});

test('nombres: acepta los alternativos', () => {
  assert.equal(esCorrecta(nombrar(nh3), 'azano', [nh3]), true);
  assert.equal(normalizarNombre('Hierro (III)'), 'hierro(iii)');
});

test('batería: sin repeticiones y con el tamaño pedido', () => {
  const compuestos = Array.from({ length: 50 }, (_, i) => ({ formula: `X${i}`, nombre: `n${i}`, alternativos: [] }));
  const preguntas = crearBateria([{ id: 's', compuestos }], 'mezcla', 15);
  assert.equal(preguntas.length, 15);
  assert.equal(new Set(preguntas.map((p) => p.compuesto.formula)).size, 15);
  assert.equal(crearBateria([{ id: 's', compuestos }], 'formulacion', 80).length, 50);
});

test('barajar: todos los elementos tienen la misma probabilidad de salir primero', () => {
  const veces = [0, 0, 0, 0, 0];
  for (let i = 0; i < 50000; i++) veces[barajar([0, 1, 2, 3, 4])[0]]++;
  for (const v of veces) assert.ok(Math.abs(v - 10000) < 600, `salió ${v} veces`);
});

test('test: dos intentos por pregunta', () => {
  const t = new Test([formular(coo), formular(nh3)], (p, r) => esCorrecta(p, r, [p.compuesto]));
  assert.equal(t.siguiente(), false); // no se puede saltar sin responder
  assert.equal(t.responder('COO'), 'reintentar');
  assert.equal(t.responder('CoO'), 'acierto');
  assert.equal(t.siguiente(), true);
  assert.equal(t.responder('NH4'), 'reintentar');
  assert.equal(t.responder('NH2'), 'fallo');
  assert.equal(t.responder('NH3'), null); // ya respondida
  t.siguiente();
  assert.equal(t.terminado, true);
  assert.equal(t.aciertos, 1);
  assert.equal(t.fallos.length, 1);
  assert.equal(t.porcentaje, 50);
});
