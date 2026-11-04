// Interfaz del constructor de compuestos: conecta constructor.html con la
// química de quimica.js. Aquí solo se lee lo que toca el alumno y se pinta.
import { t, traducirPagina } from './textos.js';
import { ionesPosibles, proporcionMinima, evaluar, compuesto, formula } from './quimica.js';
import { pintarFormula } from './pintar.js';

const SISTEMAS = ['sistematica', 'stock', 'tradicional'];
const MAX_FICHAS = 12;
const INICIO = { elementos: ['Fe', 'O'], valencia: 3 }; // para que la página no empiece vacía

const $ = (selector) => document.querySelector(selector);
const mayuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

let elementos = {}; // simbolo -> elemento (data/elementos.json)
const estado = {
  elegidos: [], // símbolos, como mucho dos
  posibles: null, // resultado de ionesPosibles()
  cation: null,
  anion: null,
  nCationes: 0,
  nAniones: 0,
};

// ---------- Pequeñas utilidades de dibujo ----------

/** Fe³⁺, O₂²⁻… como nodos (sin innerHTML), para fichas y botones. */
function etiquetaIon(ion) {
  const span = document.createElement('span');
  span.className = 'ion';
  span.append(ion.simbolo);
  if (ion.atomos > 1) {
    const sub = document.createElement('sub');
    sub.textContent = ion.atomos;
    span.append(sub);
  }
  const sup = document.createElement('sup');
  const valor = Math.abs(ion.carga);
  sup.textContent = `${valor > 1 ? valor : ''}${ion.carga > 0 ? '+' : '−'}`;
  span.append(sup);
  return span;
}

/** Texto plano del ion, para las etiquetas de accesibilidad: "Fe 3+". */
const textoIon = (ion) => `${ion.simbolo}${ion.atomos > 1 ? ion.atomos : ''} ${Math.abs(ion.carga)}${ion.carga > 0 ? '+' : '−'}`;

// ---------- Paso 1: la tabla de elementos ----------

function pintarTabla() {
  const tabla = $('#tabla-elementos');
  for (const el of Object.values(elementos)) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `elemento ${el.metal ? 'elemento--metal' : 'elemento--no-metal'}`;
    // Los grupos 3, 4 y 5 no tienen ningún elemento de los ejercicios: se
    // quitan esas columnas para que la tabla quepa en el móvil.
    boton.style.gridColumn = el.grupo <= 2 ? el.grupo : el.grupo - 3;
    boton.style.gridRow = el.periodo;
    boton.textContent = el.simbolo;
    boton.title = el.nombre;
    boton.setAttribute('aria-label', el.nombre);
    boton.dataset.simbolo = el.simbolo;
    boton.addEventListener('click', () => elegirElemento(el.simbolo));
    tabla.append(boton);
  }
}

function elegirElemento(simbolo) {
  const { elegidos } = estado;
  if (elegidos.includes(simbolo)) elegidos.splice(elegidos.indexOf(simbolo), 1);
  else if (elegidos.length < 2) elegidos.push(simbolo);
  else elegidos[1] = simbolo; // con dos elegidos, se cambia el segundo
  actualizarElementos();
}

function actualizarElementos() {
  const [primero, segundo] = estado.elegidos.map((s) => elementos[s]);
  for (const boton of document.querySelectorAll('.elemento')) {
    const el = elementos[boton.dataset.simbolo];
    const elegido = estado.elegidos.includes(el.simbolo);
    boton.setAttribute('aria-pressed', elegido);
    // Se apagan los que no combinan con el primero (pero se pueden tocar:
    // así el alumno descubre el porqué en el mensaje).
    boton.classList.toggle('elemento--apagado', Boolean(primero && !elegido && ionesPosibles(primero, el).error));
  }

  const aviso = $('#estado-elementos');
  aviso.classList.remove('estado--mal');
  estado.posibles = null;
  if (!primero) {
    aviso.textContent = '';
  } else if (!segundo) {
    aviso.textContent = `${mayuscula(primero.nombre)}. ${t('c.eligeOtro')}`;
  } else {
    const posibles = ionesPosibles(primero, segundo);
    if (posibles.error) {
      aviso.textContent = t(`c.error.${posibles.error}`);
      aviso.classList.add('estado--mal');
    } else {
      aviso.textContent = `${mayuscula(posibles.delante.nombre)} + ${posibles.detras.nombre}`;
      estado.posibles = posibles;
    }
  }
  pintarIones();
}

// ---------- Paso 2: elegir los iones ----------

function pintarIones() {
  const { posibles } = estado;
  $('#paso-iones').hidden = !posibles;
  if (!posibles) {
    pintarFichas();
    return;
  }
  // Si se cambia de elementos, se intenta conservar la carga elegida.
  const igual = (lista, actual) => lista.find((i) => actual && i.simbolo === actual.simbolo && i.carga === actual.carga);
  estado.cation = igual(posibles.cationes, estado.cation) ?? posibles.cationes[0];
  estado.anion = igual(posibles.aniones, estado.anion) ?? posibles.aniones[0];
  pintarChips('#cationes', 'cation', posibles.cationes);
  pintarChips('#aniones', 'anion', posibles.aniones);
  empezarFichas();
}

function pintarChips(selector, clave, iones) {
  const contenedor = $(selector);
  contenedor.replaceChildren();
  for (const ion of iones) {
    const label = document.createElement('label');
    label.className = 'chip';
    const input = document.createElement('input');
    Object.assign(input, { type: 'radio', name: clave, checked: ion === estado[clave] });
    input.addEventListener('change', () => {
      estado[clave] = ion;
      empezarFichas();
    });
    label.append(input, etiquetaIon(ion));
    if (ion.simbolo === 'O' && ion.atomos === 2) {
      const small = document.createElement('small');
      small.textContent = t('c.peroxido');
      label.append(small);
    }
    contenedor.append(label);
  }
}

// ---------- Paso 3: la mesa de fichas ----------

/** Cada vez que cambian los iones se empieza con una ficha de cada. */
function empezarFichas() {
  estado.nCationes = 1;
  estado.nAniones = 1;
  pintarFichas();
}

function cambiar(clave, delta) {
  estado[clave] = Math.min(MAX_FICHAS, Math.max(0, estado[clave] + delta));
  pintarFichas();
}

function pintarFila(contenedor, ion, cantidad, escala) {
  contenedor.replaceChildren();
  for (let i = 0; i < cantidad; i++) {
    const ficha = document.createElement('span');
    ficha.className = `ficha ${ion.carga > 0 ? 'ficha--positiva' : 'ficha--negativa'}`;
    // El ancho es proporcional a la carga: dos O²⁻ ocupan lo mismo que un ion 4+.
    ficha.style.width = `${(Math.abs(ion.carga) / escala) * 100}%`;
    ficha.append(etiquetaIon(ion));
    contenedor.append(ficha);
  }
}

function pintarFichas() {
  const { posibles, cation, anion, nCationes, nAniones } = estado;
  $('#paso-fichas').hidden = !posibles;
  if (!posibles) {
    pintarResultado(null);
    return;
  }
  const ev = evaluar(cation, anion, nCationes, nAniones);
  const escala = Math.max(ev.positiva, ev.negativa, 1);
  pintarFila($('#fichas-cationes'), cation, nCationes, escala);
  pintarFila($('#fichas-aniones'), anion, nAniones, escala);
  $('#n-cationes').textContent = nCationes;
  $('#n-aniones').textContent = nAniones;
  $('#carga-positiva').textContent = t('c.cargasPositivas', { n: ev.positiva });
  $('#carga-negativa').textContent = t('c.cargasNegativas', { n: ev.negativa });

  const botones = [['#quitar-cation', 'c.quitar', cation], ['#poner-cation', 'c.poner', cation], ['#quitar-anion', 'c.quitar', anion], ['#poner-anion', 'c.poner', anion]];
  for (const [selector, clave, ion] of botones) $(selector).setAttribute('aria-label', t(clave, { ion: textoIon(ion) }));
  $('#quitar-cation').disabled = nCationes === 0;
  $('#quitar-anion').disabled = nAniones === 0;
  $('#poner-cation').disabled = nCationes === MAX_FICHAS;
  $('#poner-anion').disabled = nAniones === MAX_FICHAS;

  const aviso = $('#estado-fichas');
  aviso.className = 'estado';
  if (!nCationes || !nAniones) {
    aviso.textContent = t('c.estadoVacio');
  } else if (ev.positiva !== ev.negativa) {
    const diferencia = Math.abs(ev.positiva - ev.negativa);
    const clave = ev.positiva > ev.negativa ? 'c.faltanNegativas' : 'c.faltanPositivas';
    aviso.textContent = t(diferencia === 1 ? `${clave}.una` : clave, { n: diferencia });
  } else {
    aviso.textContent = ev.divisor > 1 ? t('c.simplificar', { n: ev.divisor }) : t('c.neutro');
    aviso.classList.add('estado--bien');
  }
  pintarResultado(ev);
}

// ---------- Resultado ----------

function pintarResultado(ev) {
  $('#resultado').hidden = !ev?.neutro;
  if (!ev?.neutro) return;
  const { cation, anion, nCationes, nAniones, posibles } = estado;
  const res = compuesto(cation, anion, elementos, posibles.invertir);

  const sinSimplificar = $('#formula-sin-simplificar');
  sinSimplificar.hidden = ev.divisor === 1;
  if (ev.divisor > 1) pintarFormula(sinSimplificar, formula(cation, anion, nCationes, nAniones, posibles.invertir));
  pintarFormula($('#formula'), res.formula);
  $('#tipo').textContent = t('c.tipo', { tipo: t(`tipo.${res.tipo}`) });

  const lista = $('#nombres');
  lista.replaceChildren();
  for (const sistema of SISTEMAS) {
    const nombres = res.nombres[sistema];
    const dt = document.createElement('dt');
    dt.textContent = t(`sistema.${sistema}`);
    const dd = document.createElement('dd');
    if (!nombres) {
      dd.className = 'nombres__vacio';
      dd.textContent = t('c.noSeUsa');
    } else {
      const principal = document.createElement('strong');
      principal.textContent = nombres.nombre;
      dd.append(principal);
      const extras = [];
      if (nombres.alternativos.length) extras.push(t('c.tambien', { nombres: nombres.alternativos.join(' · ') }));
      if (nombres.disolucion) extras.push(t('c.disolucion', { formula: res.formula }));
      for (const texto of extras) {
        const small = document.createElement('small');
        small.textContent = texto;
        dd.append(small);
      }
    }
    lista.append(dt, dd);
  }

  const notas = $('#notas');
  notas.replaceChildren(...res.notas.map((clave) => {
    const li = document.createElement('li');
    li.textContent = t(`c.nota.${clave}`);
    return li;
  }));
}

// ---------- Arranque ----------

async function iniciar() {
  traducirPagina();
  try {
    const respuesta = await fetch('data/elementos.json');
    if (!respuesta.ok) throw new Error(respuesta.status);
    const datos = await respuesta.json();
    elementos = Object.fromEntries(datos.elementos.map((e) => [e.simbolo, e]));
  } catch {
    $('#error').hidden = false;
    return;
  }

  pintarTabla();
  $('#quitar-cation').addEventListener('click', () => cambiar('nCationes', -1));
  $('#poner-cation').addEventListener('click', () => cambiar('nCationes', 1));
  $('#quitar-anion').addEventListener('click', () => cambiar('nAniones', -1));
  $('#poner-anion').addEventListener('click', () => cambiar('nAniones', 1));
  $('#ajustar').addEventListener('click', () => {
    Object.assign(estado, proporcionMinima(estado.cation, estado.anion));
    pintarFichas();
  });
  $('#vaciar').addEventListener('click', () => {
    Object.assign(estado, { nCationes: 0, nAniones: 0 });
    pintarFichas();
  });

  estado.elegidos = [...INICIO.elementos];
  estado.cation = { simbolo: INICIO.elementos[0], carga: INICIO.valencia };
  actualizarElementos();
}

iniciar();
