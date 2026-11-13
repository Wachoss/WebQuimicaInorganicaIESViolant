// Corrección de respuestas. Solo funciones puras (sin tocar la página), para
// poder probarlas con Node: node --test tools/*.test.mjs

const SUBINDICES = '₀₁₂₃₄₅₆₇₈₉';

/**
 * Fórmulas: se quitan TODOS los espacios y se pasan los subíndices Unicode
 * (H₂O) a números normales (H2O). Las mayúsculas se respetan: "CoO" es óxido
 * de cobalto y "COO" no es nada, así que no pueden contar igual.
 */
export function normalizarFormula(texto) {
  return texto
    .replace(/\s+/g, '')
    .replace(/[₀-₉]/g, (d) => String(SUBINDICES.indexOf(d)));
}

/**
 * Nombres: se ignoran mayúsculas, tildes y espacios sobrantes, porque escribir
 * "oxido de calcio" es una falta de ortografía, no un error de química.
 * También da igual "hierro (III)" que "hierro(III)".
 */
export function normalizarNombre(texto) {
  return texto
    .normalize('NFD') // separa la tilde de la letra: "ó" -> "o" + "́"
    .replace(/[̀-ͯ]/g, '') // y quita las tildes sueltas
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .trim();
}

/** Todos los nombres válidos de un compuesto: el principal y los alternativos. */
export function nombresValidos(compuesto) {
  return [compuesto.nombre, ...compuesto.alternativos];
}

/**
 * ¿Es correcta la respuesta a una pregunta?
 *
 * pregunta.modo === 'formulacion': se muestra un nombre y se pide la fórmula.
 *   Se acepta la fórmula de cualquier compuesto de la misma sección que tenga
 *   ese nombre (por si dos fórmulas de la sección comparten nombre).
 * pregunta.modo === 'nomenclatura': se muestra una fórmula y se pide el nombre.
 *   Se acepta el nombre principal o cualquiera de los alternativos.
 */
export function esCorrecta(pregunta, respuesta, compuestosDeLaSeccion) {
  if (pregunta.modo === 'formulacion') {
    const dada = normalizarFormula(respuesta);
    const nombre = normalizarNombre(pregunta.compuesto.nombre);
    return compuestosDeLaSeccion
      .filter((c) => nombresValidos(c).some((n) => normalizarNombre(n) === nombre))
      .some((c) => c.formula === dada);
  }
  const dada = normalizarNombre(respuesta);
  return nombresValidos(pregunta.compuesto).some((n) => normalizarNombre(n) === dada);
}
