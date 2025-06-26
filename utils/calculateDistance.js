export function calcularDistancia(p1, p2) {
  const dx = p2.lat - p1.lat;
  const dy = p2.lon - p1.lon;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ordenarPontos(pontos) {
  const visitados = [pontos[0]];
  const restantes = pontos.slice(1);

  while (restantes.length > 0) {
    const ultimo = visitados[visitados.length - 1];
    let maisProximoIndex = 0;
    let menorDistancia = calcularDistancia(ultimo, restantes[0]);

    for (let i = 1; i < restantes.length; i++) {
      const dist = calcularDistancia(ultimo, restantes[i]);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        maisProximoIndex = i;
      }
    }

    visitados.push(restantes.splice(maisProximoIndex, 1)[0]);
  }

  return visitados;
}
