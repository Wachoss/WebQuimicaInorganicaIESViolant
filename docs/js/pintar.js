// Utilidades de dibujo compartidas por el test y el constructor.

/** Pinta una fórmula con subíndices: "Fe2(SO4)3" -> Fe₂(SO₄)₃. Sin innerHTML. */
export function pintarFormula(contenedor, formula) {
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
