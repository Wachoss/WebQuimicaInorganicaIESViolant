// Interfaz: conecta la página con la lógica de bateria.js y correccion.js.
import { t, traducirPagina } from './textos.js';
import { esCorrecta } from './correccion.js';
import { crearBateria, Test } from './bateria.js';

const SISTEMAS = ['sistematica', 'stock', 'tradicional'];
const MODOS = ['formulacion', 'nomenclatura', 'mezcla'];
const CANTIDADES = [10, 15, 20, 30];
const CANTIDAD_POR_DEFECTO = 15;
const CLAVE_GUARDADO = 'formulacion-seleccion';

const $ = (selector) => document.querySelector(selector);
const pantallas = ['#pantalla-seleccion', '#pantalla-test', '#pantalla-resultado'];

let indice = []; // [{ id, tipo, grupo, sistema, total }] de data/indice.json
const cacheSecciones = new Map(); // id -> sección ya descargada
let test = null;

// ---------- Utilidades ----------

function mostrarPantalla(selector) {
  for (const p of pantallas) $(p).hidden = p !== selector;
  window.scrollTo({ top: 0 });
}

/** Pinta una fórmula con subíndices: "Fe2(SO4)3" -> Fe₂(SO₄)₃. Sin innerHTML. */
function pintarFormula(contenedor, formula) {
  contenedor.replaceChildren();
  for (const trozo of formula.split(/(\d+)/)) {
    if (trozo === '') continue;
    if (/^\d+$/.test(trozo)) {
      const sub = document.createElement('sub');
      sub.textContent = trozo;
      contenedor.append(sub);
    } else {
      contenedor.append(trozo);
    }
  }
}

function crearOpcion({ tipo, nombre, valor, texto, ayuda, marcada }) {
  const label = document.createElement('label');
  label.className = 'opcion';
  const input = document.createElement('input');
  Object.assign(input, { type: tipo, name: nombre, value: valor, checked: marcada });
  const textos = document.createElement('span');
  textos.className = 'opcion__texto';
  textos.textContent = texto;
  if (ayuda) {
    const small = document.createElement('small');
    small.textContent = ayuda;
    textos.append(small);
  }
  label.append(input, textos);
  return label;
}

const marcados = (nombre) => [...document.querySelectorAll(`input[name="${nombre}"]:checked`)].map((i) => i.value);

// ---------- Pantalla de selección ----------

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) ?? {};
  } catch {
    return {}; // navegación privada o almacenamiento bloqueado: no pasa nada
  }
}

function guardarSeleccion(seleccion) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(seleccion));
  } catch {
    // sin almacenamiento: simplemente no se recuerda
  }
}

function construirSeleccion() {
  const guardado = leerGuardado();
  const tipos = [...new Map(indice.map((s) => [s.tipo, s.grupo]))]; // [[tipo, grupo]] sin repetir

  for (const [tipo, grupo] of tipos) {
    const sistemas = indice.filter((s) => s.tipo === tipo).map((s) => s.sistema);
    const ayuda = sistemas.length < SISTEMAS.length
      ? t('soloEn', { sistemas: sistemas.map((s) => t(`sistema.${s}`)).join(', ') })
      : '';
    const marcada = guardado.tipos ? guardado.tipos.includes(tipo) : tipo === 'oxidos';
    $(`#tipos-${grupo}`).append(crearOpcion({ tipo: 'checkbox', nombre: 'tipo', valor: tipo, texto: t(`tipo.${tipo}`), ayuda, marcada }));
  }
  for (const sistema of SISTEMAS) {
    const marcada = guardado.sistemas ? guardado.sistemas.includes(sistema) : sistema !== 'tradicional';
    $('#sistemas').append(crearOpcion({ tipo: 'checkbox', nombre: 'sistema', valor: sistema, texto: t(`sistema.${sistema}`), marcada }));
  }
  for (const modo of MODOS) {
    const marcada = (guardado.modo ?? 'formulacion') === modo;
    $('#modos').append(crearOpcion({ tipo: 'radio', nombre: 'modo', valor: modo, texto: t(`modo.${modo}`), ayuda: t(`modo.${modo}.ayuda`), marcada }));
  }
  for (const cantidad of CANTIDADES) {
    const marcada = (guardado.cantidad ?? CANTIDAD_POR_DEFECTO) === cantidad;
    $('#cantidades').append(crearOpcion({ tipo: 'radio', nombre: 'cantidad', valor: cantidad, texto: String(cantidad), marcada }));
  }

  $('#pantalla-seleccion').addEventListener('change', actualizarSeleccion);
  for (const boton of document.querySelectorAll('[data-marcar]')) {
    boton.addEventListener('click', () => {
      const casillas = [...document.querySelectorAll(`#tipos-${boton.dataset.marcar} input:not(:disabled)`)];
      const todasMarcadas = casillas.every((c) => c.checked);
      for (const c of casillas) c.checked = !todasMarcadas;
      actualizarSeleccion();
    });
  }
  $('#pantalla-seleccion').addEventListener('submit', (e) => {
    e.preventDefault();
    empezar();
  });
  actualizarSeleccion();
}

/** Secciones de indice.json que encajan con lo marcado. */
function seccionesElegidas() {
  const tipos = marcados('tipo');
  const sistemas = marcados('sistema');
  return indice.filter((s) => tipos.includes(s.tipo) && sistemas.includes(s.sistema));
}

/**
 * Se ejecuta cada vez que cambia algo: desactiva los tipos que no existen en
 * las nomenclaturas marcadas (p. ej. oxoácidos sin "Tradicional"), actualiza
 * los botones Todos/Ninguno y el resumen.
 */
function actualizarSeleccion() {
  const sistemas = marcados('sistema');
  for (const casilla of document.querySelectorAll('input[name="tipo"]')) {
    const existe = indice.some((s) => s.tipo === casilla.value && sistemas.includes(s.sistema));
    casilla.disabled = !existe;
    casilla.closest('.opcion').classList.toggle('opcion--desactivada', !existe);
  }
  for (const boton of document.querySelectorAll('[data-marcar]')) {
    const casillas = [...document.querySelectorAll(`#tipos-${boton.dataset.marcar} input:not(:disabled)`)];
    boton.textContent = casillas.length && casillas.every((c) => c.checked) ? t('ninguno') : t('todos');
  }

  const secciones = seccionesElegidas();
  const disponibles = secciones.reduce((total, s) => total + s.total, 0);
  const cantidad = Number(marcados('cantidad')[0]);
  $('#resumen').textContent = disponibles
    ? t('resumen', { preguntas: Math.min(cantidad, disponibles), disponibles })
    : t('resumenVacio');
  $('#empezar').disabled = disponibles === 0;
}

// ---------- Test ----------

async function cargarSeccion(entrada) {
  if (!cacheSecciones.has(entrada.id)) {
    const respuesta = await fetch(`data/${entrada.id}.json`);
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${entrada.id}`);
    cacheSecciones.set(entrada.id, await respuesta.json());
  }
  return cacheSecciones.get(entrada.id);
}

async function empezar() {
  const elegidas = seccionesElegidas();
  if (!elegidas.length) return;
  const modo = marcados('modo')[0];
  const cantidad = Number(marcados('cantidad')[0]);
  // Solo se guarda lo que la casilla permite usar (las desactivadas no cuentan).
  const tipos = [...document.querySelectorAll('input[name="tipo"]:checked:not(:disabled)')].map((i) => i.value);
  guardarSeleccion({ tipos, sistemas: marcados('sistema'), modo, cantidad });

  $('#empezar').disabled = true;
  try {
    const secciones = await Promise.all(elegidas.map(cargarSeccion));
    const preguntas = crearBateria(secciones, modo, cantidad);
    // Para formular, se aceptan las fórmulas de la misma sección con ese nombre.
    test = new Test(preguntas, (pregunta, respuesta) => esCorrecta(pregunta, respuesta, pregunta.seccion.compuestos));
    $('#n-aciertos').textContent = '0';
    $('#n-fallos').textContent = '0';
    mostrarPantalla('#pantalla-test');
    pintarPregunta();
  } catch (error) {
    console.error(error);
    $('#error').hidden = false;
  } finally {
    $('#empezar').disabled = false;
  }
}

function pintarPregunta() {
  const { seccion, compuesto, modo } = test.actual;
  const total = test.preguntas.length;
  $('#contador-pregunta').textContent = t('preguntaDe', { n: test.indice + 1, total });
  $('#progreso').style.width = `${(test.indice / total) * 100}%`;
  $('#etiqueta-seccion').textContent = `${t(`tipo.${seccion.tipo}`)} · ${t(`sistema.${seccion.sistema}`)}`;

  const formular = modo === 'formulacion';
  const enunciado = formular ? t('pideFormula') : t('pideNombre', { sistema: t(`sistema.${seccion.sistema}`) });
  $('#enunciado').textContent = enunciado;
  $('#pide').textContent = enunciado;
  if (formular) $('#compuesto').textContent = compuesto.nombre;
  else pintarFormula($('#compuesto'), compuesto.formula);
  $('#compuesto').classList.toggle('pregunta__compuesto--formula', !formular);
  $('#pista').textContent = formular ? t('pistaFormula') : t('pistaNombre');

  const campo = $('#respuesta');
  campo.value = '';
  campo.disabled = false;
  campo.classList.remove('campo--mal', 'campo--bien');
  $('#mensaje').replaceChildren();
  $('#mensaje').className = 'mensaje';
  $('#comprobar').hidden = false;
  $('#siguiente').hidden = true;
  campo.focus();
}

function comprobar() {
  const campo = $('#respuesta');
  const resultado = test.responder(campo.value);
  if (!resultado) return;
  const mensaje = $('#mensaje');

  if (resultado === 'reintentar') {
    mensaje.className = 'mensaje mensaje--mal';
    mensaje.textContent = t('incorrectoReintentar');
    campo.classList.add('campo--mal');
    campo.select();
    return;
  }

  if (resultado === 'acierto') {
    const frases = t('felicitaciones');
    // Math.floor(random * n) da de 0 a n-1, todos con la misma probabilidad.
    // (El original usaba Math.round(random * 4), que a veces daba 0 y no
    // mostraba ningún mensaje.)
    mensaje.className = 'mensaje mensaje--bien';
    mensaje.textContent = frases[Math.floor(Math.random() * frases.length)];
    campo.classList.remove('campo--mal');
    campo.classList.add('campo--bien');
  } else {
    const { compuesto, modo } = test.actual;
    mensaje.className = 'mensaje mensaje--mal';
    const solucion = document.createElement('strong');
    if (modo === 'formulacion') pintarFormula(solucion, compuesto.formula);
    else solucion.textContent = compuesto.nombre;
    mensaje.replaceChildren(`${t('incorrectoFinal')} `, solucion);
    campo.classList.add('campo--mal');
  }

  $('#n-aciertos').textContent = test.aciertos;
  $('#n-fallos').textContent = test.fallos.length;
  campo.disabled = true;
  $('#comprobar').hidden = true;
  const ultima = test.indice === test.preguntas.length - 1;
  $('#siguiente').textContent = ultima ? t('verResultado') : t('siguiente');
  $('#siguiente').hidden = false;
  $('#siguiente').focus();
}

function avanzar() {
  if (!test.siguiente()) return;
  if (test.terminado) pintarResultado();
  else pintarPregunta();
}

// ---------- Resultado ----------

function pintarResultado() {
  const { porcentaje, aciertos } = test;
  $('#porcentaje').textContent = t('porcentaje', { porcentaje });
  $('#detalle').textContent = t('detalle', { aciertos, total: test.preguntas.length });
  const nota = porcentaje >= 75 ? 'nota75' : porcentaje >= 50 ? 'nota50' : porcentaje >= 25 ? 'nota25' : 'nota0';
  $('#nota').textContent = t(nota);

  const lista = $('#lista-repaso');
  lista.replaceChildren();
  for (const { pregunta, respuesta } of test.fallos) {
    const { compuesto, modo, seccion } = pregunta;
    const li = document.createElement('li');
    const formula = document.createElement('span');
    formula.className = 'repaso__formula';
    pintarFormula(formula, compuesto.formula);
    const nombre = document.createElement('span');
    nombre.textContent = compuesto.nombre;
    const detalle = document.createElement('small');
    detalle.textContent = `${t(`sistema.${seccion.sistema}`)} · ${t('tuRespuesta')}: ${respuesta}`;
    li.append(modo === 'formulacion' ? nombre : formula, ' → ', modo === 'formulacion' ? formula : nombre, detalle);
    lista.append(li);
  }
  $('#repaso').hidden = test.fallos.length === 0;
  mostrarPantalla('#pantalla-resultado');
}

// ---------- Tablas (valencias y periódica) ----------

function prepararTablas() {
  const dialogo = $('#dialogo-tabla');
  for (const boton of document.querySelectorAll('[data-tabla]')) {
    boton.addEventListener('click', () => {
      const titulo = boton.textContent;
      $('#dialogo-titulo').textContent = titulo;
      const ruta = `img/tabla-${boton.dataset.tabla}.jpg`;
      Object.assign($('#dialogo-imagen'), { src: ruta, alt: titulo });
      $('#dialogo-enlace').href = ruta;
      dialogo.showModal();
    });
  }
  // Cerrar al pulsar fuera de la imagen.
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });
}

// ---------- Arranque ----------

async function iniciar() {
  traducirPagina();
  prepararTablas();

  $('#formulario-respuesta').addEventListener('submit', (e) => {
    e.preventDefault();
    // Enter sirve para comprobar y, si ya está respondida, para pasar a la siguiente.
    if (test.respondida) avanzar();
    else comprobar();
  });
  $('#siguiente').addEventListener('click', avanzar);
  $('#salir').addEventListener('click', () => mostrarPantalla('#pantalla-seleccion'));
  $('#repetir').addEventListener('click', empezar);
  $('#cambiar').addEventListener('click', () => mostrarPantalla('#pantalla-seleccion'));

  try {
    const respuesta = await fetch('data/indice.json');
    if (!respuesta.ok) throw new Error('Sin índice');
    indice = await respuesta.json();
  } catch (error) {
    console.error(error);
    $('#error').hidden = false;
    return;
  }
  construirSeleccion();
  mostrarPantalla('#pantalla-seleccion');
}

iniciar();
