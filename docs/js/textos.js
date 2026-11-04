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
