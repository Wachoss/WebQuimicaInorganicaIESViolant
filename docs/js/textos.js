// Textos de la interfaz, separados del código para poder traducir la web
// (por ejemplo, al valenciano) añadiendo otro bloque con las mismas claves.
// Los textos fijos del HTML llevan data-texto="clave"; los que cambian se
// piden desde app.js con t('clave', { valores }).

export const textos = {
  es: {
    titulo: 'Formulación inorgánica',
    subtitulo: 'Practica formulación y nomenclatura con baterías de preguntas a tu medida.',

    pasoTipos: '1. ¿Qué compuestos quieres practicar?',
    pasoSistemas: '2. ¿Con qué nomenclaturas?',
    pasoModo: '3. ¿Qué quieres hacer?',
    pasoCantidad: '4. ¿Cuántas preguntas?',
    binarios: 'Binarios',
    ternarios: 'Ternarios y cuaternarios',
    todos: 'Todos',
    ninguno: 'Ninguno',

    'tipo.hidruros': 'Hidruros',
    'tipo.oxidos': 'Óxidos',
    'tipo.sales': 'Sales binarias',
    'tipo.peroxidos': 'Peróxidos',
    'tipo.hidroxidos': 'Hidróxidos',
    'tipo.oxoacidos': 'Oxoácidos',
    'tipo.oxosales': 'Oxosales',
    'tipo.sales-acidas': 'Sales ácidas',

    'sistema.sistematica': 'Sistemática',
    'sistema.stock': 'Stock',
    'sistema.tradicional': 'Tradicional',
    soloEn: 'solo {sistemas}',

    'modo.formulacion': 'Formular',
    'modo.formulacion.ayuda': 'nombre → fórmula',
    'modo.nomenclatura': 'Nombrar',
    'modo.nomenclatura.ayuda': 'fórmula → nombre',
    'modo.mezcla': 'Mezcla',
    'modo.mezcla.ayuda': 'de las dos formas',

    resumen: '{preguntas} preguntas de {disponibles} compuestos disponibles',
    resumenVacio: 'Elige al menos un tipo de compuesto y una nomenclatura.',
    empezar: 'Empezar',

    preguntaDe: 'Pregunta {n} de {total}',
    aciertos: 'Aciertos',
    fallos: 'Fallos',
    pideFormula: '¿Qué fórmula tiene?',
    pideNombre: '¿Cómo se llama en nomenclatura {sistema}?',
    pistaFormula: 'Escribe los números normales: H2O',
    pistaNombre: 'Las tildes y las mayúsculas no cuentan',
    comprobar: 'Comprobar',
    siguiente: 'Siguiente',
    verResultado: 'Ver resultado',
    salir: 'Salir del test',
    incorrectoReintentar: 'No es correcto. Tienes otro intento.',
    incorrectoFinal: 'No es correcto. La respuesta es:',
    felicitaciones: ['¡Correcto! ¡Eres un crack!', '¡Bien hecho!', '¡Lo tienes controlado!', '¡Sigue así!'],

    resultado: 'Resultado',
    porcentaje: '{porcentaje}%',
    detalle: '{aciertos} aciertos de {total} preguntas',
    nota0: '¡Uf! Aún te falta, vuelve a intentarlo.',
    nota25: 'Tendrás que mejorar para aprobar.',
    nota50: '¡Bien hecho, campeón!',
    nota75: 'No hace falta que hagas el examen: que te pongan el 10 ya.',
    repasar: 'Para repasar',
    tuRespuesta: 'Tu respuesta',
    repetir: 'Otra batería igual',
    cambiar: 'Cambiar la selección',

    tablaValencias: 'Tabla de valencias',
    tablaPeriodica: 'Tabla periódica',
    cerrar: 'Cerrar',
    ampliar: 'Toca la imagen para abrirla en grande.',
    errorDatos: 'No se han podido cargar los compuestos. Si has abierto el archivo directamente, ábrelo con un servidor local (por ejemplo: python3 -m http.server dentro de docs/).',

    irConstructor: 'Constructor de compuestos',

    // Constructor de compuestos (constructor.html)
    'c.titulo': 'Constructor de compuestos',
    'c.subtitulo': 'Junta fichas de iones hasta que las cargas se compensen y descubre la fórmula y el nombre.',
    'c.volver': 'Ir a los tests',
    'c.paso1': '1. Elige dos elementos',
    'c.paso1.ayuda': 'Toca dos elementos de la tabla. Los que no pueden combinarse con el primero se apagan.',
    'c.metal': 'Metal',
    'c.noMetal': 'No metal',
    'c.eligeOtro': 'Ahora elige el segundo elemento.',
    'c.paso2': '2. Elige con qué carga actúa cada uno',
    'c.positivo': 'Delante (carga positiva)',
    'c.negativo': 'Detrás (carga negativa)',
    'c.peroxido': 'peróxido',
    'c.paso3': '3. Junta fichas hasta que las cargas se compensen',
    'c.paso3.ayuda': 'Cada ficha ocupa tanto como su carga. El compuesto es neutro cuando las dos filas miden lo mismo.',
    'c.cargasPositivas': 'Cargas positivas: {n}',
    'c.cargasNegativas': 'Cargas negativas: {n}',
    'c.quitar': 'Quitar una ficha de {ion}',
    'c.poner': 'Añadir una ficha de {ion}',
    'c.ajustar': 'Ajústalo por mí',
    'c.vaciar': 'Vaciar',
    'c.estadoVacio': 'Añade al menos una ficha de cada fila.',
    'c.faltanNegativas': 'Faltan {n} cargas negativas (o sobran positivas).',
    'c.faltanPositivas': 'Faltan {n} cargas positivas (o sobran negativas).',
    'c.faltanNegativas.una': 'Falta 1 carga negativa (o sobra una positiva).',
    'c.faltanPositivas.una': 'Falta 1 carga positiva (o sobra una negativa).',
    'c.neutro': '¡Neutro! Las cargas se compensan.',
    'c.simplificar': 'Es neutro, pero se puede simplificar: divide las dos cantidades entre {n}.',
    'c.resultado': 'Tu compuesto',
    'c.tambien': 'También vale: {nombres}',
    'c.noSeUsa': 'No se usa para este compuesto.',
    'c.disolucion': 'Este nombre es para el compuesto disuelto en agua: {formula}(aq).',
    'c.tipo': 'Tipo: {tipo}',
    'c.nota.oxigenoDelante': 'Con los halógenos, el oxígeno se escribe delante (normas IUPAC de 2005): por eso es OCl₂ y no Cl₂O.',
    'c.nota.mercurioI': 'El mercurio(I) va siempre en parejas, como ion Hg₂²⁺. Por eso no se simplifica: es Hg₂Cl₂ y no HgCl.',
    'c.nota.peroxido': 'El ion peróxido O₂²⁻ es un bloque: el 2 del oxígeno no se simplifica nunca.',
    'c.error.mismoElemento': 'Elige dos elementos distintos.',
    'c.error.dosMetales': 'Dos metales no forman un compuesto binario de los que se estudian aquí.',
    'c.error.noCombinan': 'Con las valencias de la tabla, estos dos elementos no forman un compuesto binario.',

    creditos: 'Creada por el alumnado de 2.º de Bachillerato de TIC II del IES Violant de Casalduch (Benicàssim) en 2018. Corregida en 2023 y modernizada en 2026.',
    original: 'Ver la versión original',
    codigo: 'Código en GitHub',
  },
};

let idioma = 'es';

/** Devuelve el texto de una clave, sustituyendo {variables}. */
export function t(clave, valores = {}) {
  const texto = textos[idioma][clave] ?? clave;
  if (typeof texto !== 'string') return texto;
  return texto.replace(/\{(\w+)\}/g, (_, nombre) => valores[nombre] ?? '');
}

/** Rellena los elementos con data-texto="clave". */
export function traducirPagina(raiz = document) {
  document.documentElement.lang = idioma;
  for (const el of raiz.querySelectorAll('[data-texto]')) {
    el.textContent = t(el.dataset.texto);
  }
}
