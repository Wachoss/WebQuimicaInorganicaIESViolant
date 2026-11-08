// Lógica del test, sin tocar la página: crear la batería de preguntas y
// llevar la cuenta de intentos, aciertos y fallos.

export const INTENTOS_POR_PREGUNTA = 2;

/**
 * Baraja una copia del array con el algoritmo de Fisher-Yates: todas las
 * ordenaciones son igual de probables. (El original usaba
 * Math.round(Math.random() * N), que saca el primer y el último elemento la
 * mitad de veces que los demás, y podía repetir preguntas.)
 */
export function barajar(lista, aleatorio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Crea la batería de preguntas.
 *
 * secciones: [{ id, tipo, sistema, compuestos }] elegidas por el alumno.
 * modo: 'formulacion' | 'nomenclatura' | 'mezcla'.
 * cantidad: número de preguntas que se quieren (si no hay tantas, se usan todas).
 *
 * Nunca se pregunta dos veces el mismo compuesto de la misma sección, ni
 * siquiera en el modo mezcla (una vez en cada dirección).
 */
export function crearBateria(secciones, modo, cantidad, aleatorio = Math.random) {
  const candidatas = [];
  for (const seccion of secciones) {
    for (const compuesto of seccion.compuestos) {
      candidatas.push({ seccion, compuesto });
    }
  }
  const elegidas = barajar(candidatas, aleatorio).slice(0, cantidad);
  return elegidas.map(({ seccion, compuesto }) => ({
    seccion,
    compuesto,
    modo: modo === 'mezcla' ? (aleatorio() < 0.5 ? 'formulacion' : 'nomenclatura') : modo,
  }));
}

/** Número de preguntas distintas que se pueden hacer con estas secciones. */
export function preguntasDisponibles(secciones) {
  return secciones.reduce((total, s) => total + s.compuestos.length, 0);
}

/**
 * Estado de un test en curso. No sabe nada del HTML: la interfaz le pasa las
 * respuestas y pinta lo que devuelve.
 */
export class Test {
  constructor(preguntas, corregir) {
    this.preguntas = preguntas;
    this.corregir = corregir; // (pregunta, respuesta) => boolean
    this.indice = 0;
    this.intentos = 0;
    this.aciertos = 0;
    this.fallos = [];
    this.respondida = false;
  }

  get actual() {
    return this.preguntas[this.indice];
  }

  get terminado() {
    return this.indice >= this.preguntas.length;
  }

  /**
   * Corrige la respuesta a la pregunta actual. Devuelve:
   *  'acierto'      -> correcta
   *  'reintentar'   -> incorrecta y le queda otro intento
   *  'fallo'        -> incorrecta y sin intentos (se cuenta como fallo)
   *  null           -> la pregunta ya estaba respondida o la respuesta vacía
   */
  responder(respuesta) {
    if (this.respondida || respuesta.trim() === '') return null;
    this.intentos++;
    if (this.corregir(this.actual, respuesta)) {
      this.aciertos++;
      this.respondida = true;
      return 'acierto';
    }
    if (this.intentos < INTENTOS_POR_PREGUNTA) return 'reintentar';
    this.fallos.push({ pregunta: this.actual, respuesta });
    this.respondida = true;
    return 'fallo';
  }

  /** Pasa a la siguiente pregunta. Solo se puede si la actual está respondida. */
  siguiente() {
    if (!this.respondida) return false;
    this.indice++;
    this.intentos = 0;
    this.respondida = false;
    return true;
  }

  get porcentaje() {
    return Math.round((this.aciertos * 100) / this.preguntas.length);
  }
}
