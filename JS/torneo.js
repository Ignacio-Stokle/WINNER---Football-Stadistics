
document.addEventListener("DOMContentLoaded", async () => {
    const pagina = document.getElementById("pagina-torneo");
    const ranking = document.getElementById("ranking-competicion");

    if (!pagina || !ranking) return;

    const nombreCompeticion = pagina.dataset.competicion;

    try {
        const datos = await cargarDatos();

        // Seleccionar los títulos confirmados de esta competición.
        const titulos = datos.titulos.filter(t => {
            const competicion = obtenerCampo(
                t,
                "Competición",
                "Torneo"
            );

            return (
                normalizar(competicion) === normalizar(nombreCompeticion) &&
                tituloConfirmado(t)
            );
        });

        const campeones = new Map();
        const ediciones = new Set();

        titulos.forEach(t => {
            const equipo = obtenerCampo(t, "Equipo", "Club");
            const anio = obtenerCampo(
                t,
                "Año / temporada",
                "Año",
                "Temporada"
            );

            if (anio) ediciones.add(normalizar(anio));
            if (!equipo) return;

            const claveEquipo = normalizar(equipo);

            if (!campeones.has(claveEquipo)) {
                campeones.set(claveEquipo, {
                    equipo,
                    anios: [],
                    cantidad: 0
                });
            }

            const registro = campeones.get(claveEquipo);

            // Contar cada registro de título confirmado.
            registro.cantidad++;

            if (anio) {
                registro.anios.push(anio);
            }
        });

        const rankingOrdenado = [...campeones.values()]
            .sort((a, b) =>
                b.cantidad - a.cantidad ||
                a.equipo.localeCompare(b.equipo, "es")
            );

        // Actualizar estadísticas.
        document.getElementById("total-ediciones").textContent =
            ediciones.size;

        document.getElementById("total-campeones").textContent =
            rankingOrdenado.length;

        document.getElementById("cantidad-equipos").textContent =
            `${rankingOrdenado.length} ${
                rankingOrdenado.length === 1 ? "equipo" : "equipos"
            }`;

        const nombreLider = document.getElementById("nombre-lider");
        const escudoLider = document.getElementById("escudo-lider");
        const titulosLider = document.getElementById("titulos-lider");

        if (rankingOrdenado.length > 0) {
            const lider = rankingOrdenado[0];

            nombreLider.textContent = lider.equipo;
            titulosLider.textContent =
                `${lider.cantidad} ${
                    lider.cantidad === 1 ? "título" : "títulos"
                }`;

            escudoLider.src = rutaEscudo(lider.equipo);
            escudoLider.alt = `Escudo de ${lider.equipo}`;
            escudoLider.hidden = false;

            escudoLider.onerror = () => {
                escudoLider.hidden = true;
            };
        } else {
            nombreLider.textContent = "Sin datos";
            titulosLider.textContent = "Sin títulos confirmados";
            escudoLider.hidden = true;
        }

        ranking.replaceChildren();

        if (rankingOrdenado.length === 0) {
            ranking.textContent =
                "Todavía no hay campeones confirmados para esta competición.";
            return;
        }

        const maxTitulos = rankingOrdenado[0].cantidad;

        rankingOrdenado.forEach((campeon, indice) => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "tarjeta-ranking";

            // Posición.
            const puesto = document.createElement("span");
            puesto.className = "puesto-ranking";
            puesto.textContent = `${indice + 1}º`;

            // Escudo.
            const escudo = document.createElement("img");
            escudo.className = "escudo-ranking";
            escudo.src = rutaEscudo(campeon.equipo);
            escudo.alt = `Escudo de ${campeon.equipo}`;
            escudo.loading = "lazy";

            escudo.onerror = () => {
                escudo.hidden = true;
            };

            // Información del equipo.
            const informacion = document.createElement("div");
            informacion.className = "informacion-ranking";

            const equipo = document.createElement("h3");
            equipo.className = "nombre-ranking";
            equipo.textContent = campeon.equipo;

            const barraFondo = document.createElement("div");
            barraFondo.className = "barra-fondo";

            const barra = document.createElement("div");
            barra.className = "barra-progreso";

            barra.style.width =
                `${(campeon.cantidad / maxTitulos) * 100}%`;

            barraFondo.append(barra);

            const temporadas = document.createElement("p");
            temporadas.className = "temporadas-ranking";

            const aniosOrdenados = [...new Set(campeon.anios)]
                .sort((a, b) =>
                    String(a).localeCompare(
                        String(b),
                        "es",
                        { numeric: true }
                    )
                );

            temporadas.textContent = aniosOrdenados.length
                ? aniosOrdenados.join(" · ")
                : "Años no registrados";

            informacion.append(equipo, barraFondo, temporadas);

            // Cantidad de títulos.
            const cantidad = document.createElement("strong");
            cantidad.className = "cantidad-ranking";
            cantidad.textContent =
                `${campeon.cantidad} ${
                    campeon.cantidad === 1 ? "título" : "títulos"
                }`;

            tarjeta.append(puesto, escudo, informacion, cantidad);
            ranking.append(tarjeta);
        });

    } catch (error) {
        console.error("Error al cargar el palmarés:", error);
        ranking.textContent =
            "Error al cargar el historial: " + error.message;
    }
});


function rutaEscudo(nombre) {
    const archivo = nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `../IMG/Escudos/${archivo}.png`;
}
