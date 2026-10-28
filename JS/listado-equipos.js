
document.addEventListener("DOMContentLoaded", async () => {
    const pagina = document.getElementById("pagina-equipos");
    const lista = document.getElementById("lista-equipos");

    if (!pagina || !lista) return;

    const region = pagina.dataset.region;

    try {
        const datos = await cargarDatos();

        const equipos = datos.equipos.filter(e =>
            normalizar(
                obtenerCampo(
                    e,
                    "Región",
                    "Region",
                    "Categoría",
                    "Categoria"
                )
            ) === normalizar(region)
        );

        equipos.sort((a, b) =>
            obtenerCampo(a, "Equipo", "Nombre").localeCompare(
                obtenerCampo(b, "Equipo", "Nombre"),
                "es"
            )
        );

        lista.replaceChildren();

        if (equipos.length === 0) {
            lista.textContent =
                "No se encontraron equipos. Revisá la columna Región de Google Sheets.";
            return;
        }

        equipos.forEach(equipo => {
            const nombre = obtenerCampo(equipo, "Equipo", "Nombre");
            const tarjeta = document.createElement("button");

            tarjeta.type = "button";
            tarjeta.className = "tarjeta-equipo";

            const escudo = document.createElement("img");
            escudo.className = "escudo-equipo";
            escudo.src = `../IMG/escudos/${nombreArchivoEscudo(nombre)}.png`;
            escudo.alt = `Escudo de ${nombre}`;
            escudo.loading = "lazy";

            escudo.onerror = () => {
                console.warn(`No se encontró el escudo de ${nombre}: ${escudo.src}`);
                escudo.hidden = true;
            };

            const texto = document.createElement("span");
            texto.className = "nombre-equipo";
            texto.textContent = nombre;

            tarjeta.append(escudo, texto);


            tarjeta.addEventListener("click", () => {
                mostrarPerfilEquipo(equipo, datos);
            });

            lista.append(tarjeta);
        });

        const botonVolver = document.getElementById("volver-equipos");

        if (botonVolver) {
            botonVolver.addEventListener("click", () => {
                document.getElementById("perfil-equipo").hidden = true;
                lista.hidden = false;
            });
        }

    } catch (error) {
        console.error(error);
        lista.textContent =
            "No se pudieron cargar los equipos: " + error.message;
    }
});


function mostrarPerfilEquipo(equipo, datos) {
    const nombre = obtenerCampo(equipo, "Equipo", "Nombre");

    const perfil = document.getElementById("perfil-equipo");
    const lista = document.getElementById("lista-equipos");
    const listaTitulos = document.getElementById("lista-titulos");

    
    const nombreEquipo = document.getElementById("nombre-equipo");

    // Mostrar el nombre del equipo.
    nombreEquipo.textContent = nombre;

    // Mostrar el escudo en la ficha.
    let escudoPerfil = document.getElementById("escudo-perfil-equipo");

    if (!escudoPerfil) {
        escudoPerfil = document.createElement("img");
        escudoPerfil.id = "escudo-perfil-equipo";
        escudoPerfil.className = "escudo-perfil-equipo";

        nombreEquipo.insertAdjacentElement("beforebegin", escudoPerfil);
    }

    escudoPerfil.src = `../IMG/Escudos/${nombreArchivoEscudo(nombre)}.png`;
    escudoPerfil.alt = `Escudo de ${nombre}`;
    escudoPerfil.hidden = false;

    escudoPerfil.onerror = () => {
        escudoPerfil.hidden = true;
    };


    // Buscar títulos del equipo en todas las competiciones.
    const titulos = datos.titulos.filter(t => {
        const equipoTitulo = obtenerCampo(t, "Equipo", "Club");

        return (
            normalizar(equipoTitulo) === normalizar(nombre) &&
            tituloConfirmado(t)
        );
    });

    document.getElementById("total-titulos").textContent = titulos.length;

    listaTitulos.replaceChildren();

    
    // Agrupar títulos por competición y reunir sus años.
    const titulosPorCompeticion = new Map();

    titulos.forEach(t => {
        const competicion = obtenerCampo(
            t,
            "Competición",
            "Torneo"
        );

        const anio = obtenerCampo(
            t,
            "Año / temporada",
            "Año",
            "Temporada"
        );

        if (!titulosPorCompeticion.has(competicion)) {
            titulosPorCompeticion.set(competicion, []);
        }

        titulosPorCompeticion.get(competicion).push(anio);
    });

    if (titulos.length === 0) {
        listaTitulos.textContent =
            "Este equipo todavía no tiene títulos confirmados.";
    }

    // Ordenar las competiciones alfabéticamente.
    const competicionesOrdenadas = [...titulosPorCompeticion.keys()]
        .sort((a, b) => a.localeCompare(b, "es"));

    competicionesOrdenadas.forEach(competicion => {
        const anios = titulosPorCompeticion.get(competicion);

        // Ordenar los años de más antiguo a más reciente.
        anios.sort((a, b) =>
            a.localeCompare(b, "es", { numeric: true })
        );

        const fila = document.createElement("article");
        fila.className = "fila-titulo";

        const nombreCompeticion = document.createElement("strong");
        nombreCompeticion.textContent = competicion + ": ";

        const aniosTexto = document.createElement("span");
        aniosTexto.textContent = anios.join(", ");

        fila.append(nombreCompeticion, aniosTexto);
        listaTitulos.append(fila);
    });


    lista.hidden = true;
    perfil.hidden = false;
}


function nombreArchivoEscudo(nombre) {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
