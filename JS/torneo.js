
/*
    ============================================================
    CARGA INICIAL DE LA PÁGINA DE UNA COMPETICIÓN
    ============================================================

    Espera a que el HTML esté completamente cargado antes de ejecutar
    el código.

    async permite utilizar await para esperar la carga de datos.
*/
document.addEventListener("DOMContentLoaded", async () => {

    // Busca el contenedor principal de la página de la competición.
    const pagina = document.getElementById("pagina-torneo");

    // Busca el elemento HTML donde se mostrará el ranking.
    const ranking = document.getElementById("ranking-competicion");

    // Si alguno de los elementos no existe, termina la ejecución.
    // Evita errores si este archivo JS se carga en otra página.
    if (!pagina || !ranking) return;

    // Obtiene el nombre de la competición indicado en el HTML.
    // Por ejemplo: data-competicion="Copa Libertadores".
    const nombreCompeticion = pagina.dataset.competicion;

    try {

        // Carga todos los equipos y títulos desde Google Sheets.
        // await espera hasta que los datos estén disponibles.
        const datos = await cargarDatos();


        // ========================================================
        // FILTRAR LOS TÍTULOS DE LA COMPETICIÓN
        // ========================================================

        // filter recorre todos los títulos y conserva solamente
        // los que pertenecen a esta competición y están confirmados.
        const titulos = datos.titulos.filter(t => {

            // Obtiene el nombre de la competición del título actual.
            const competicion = obtenerCampo(
                t,
                "Competición",
                "Torneo"
            );

            // Comprueba dos condiciones:
            // 1. Que la competición coincida con la página actual.
            // 2. Que el título esté confirmado.
            //
            // Ambas deben cumplirse para que el título sea incluido.
            return (
                normalizar(competicion) === normalizar(nombreCompeticion) &&
                tituloConfirmado(t)
            );
        });


        // ========================================================
        // REGISTRAR LOS CAMPEONES Y LAS EDICIONES
        // ========================================================

        // Map permite guardar información asociada a una clave.
        //
        // En este caso, se utilizará para registrar cada equipo
        // y sus títulos, años y cantidad de campeonatos.
        const campeones = new Map();

        // Set almacena valores únicos, es decir, no permite
        // guardar dos veces el mismo elemento.
        //
        // Se utilizará para contar las ediciones de la competición
        // sin repetir años o temporadas.
        const ediciones = new Set();


        // Recorre todos los títulos confirmados de la competición.
        titulos.forEach(t => {

            // Obtiene el nombre del equipo campeón.
            const equipo = obtenerCampo(t, "Equipo", "Club");

            // Obtiene el año o temporada del título.
            const anio = obtenerCampo(
                t,
                "Año / temporada",
                "Año",
                "Temporada"
            );

            // Si existe un año, lo agrega al Set.
            // Si ese año ya estaba registrado, no lo duplica.
            if (anio) ediciones.add(normalizar(anio));

            // Si el título no tiene un equipo asociado,
            // pasa al siguiente registro.
            if (!equipo) return;

            // Normaliza el nombre del equipo para facilitar
            // las búsquedas y evitar diferencias de escritura.
            const claveEquipo = normalizar(equipo);

            // Comprueba si el equipo todavía no está registrado.
            if (!campeones.has(claveEquipo)) {

                // Si es la primera vez que aparece, lo agrega al Map.
                //
                // equipo: nombre del club.
                // anios: arreglo donde se guardarán sus temporadas.
                // cantidad: cantidad de títulos que tiene.
                campeones.set(claveEquipo, {
                    equipo,
                    anios: [],
                    cantidad: 0
                });
            }

            // Obtiene el registro del equipo que se está recorriendo.
            // Así se puede modificar su información.
            const registro = campeones.get(claveEquipo);

            // Aumenta en 1 la cantidad de títulos del equipo.
            // Cada registro confirmado se cuenta como un título.
            registro.cantidad++;

            // Si el título tiene un año registrado, lo agrega
            // al arreglo de temporadas del equipo.
            if (anio) {
                registro.anios.push(anio);
            }
        });


        // ========================================================
        // ORDENAR EL RANKING DE CAMPEONES
        // ========================================================

        // [...campeones.values()] convierte los valores del Map
        // en un arreglo para poder ordenarlos.
        const rankingOrdenado = [...campeones.values()]

            // Ordena los equipos de mayor a menor cantidad de títulos.
            // Si dos equipos tienen la misma cantidad, los ordena
            // alfabéticamente.
            .sort((a, b) =>
                b.cantidad - a.cantidad ||
                a.equipo.localeCompare(b.equipo, "es")
            );


        // ========================================================
        // ACTUALIZAR LAS ESTADÍSTICAS GENERALES
        // ========================================================

        // Muestra la cantidad de ediciones diferentes.
        // size indica cuántos elementos únicos tiene el Set.
        document.getElementById("total-ediciones").textContent =
            ediciones.size;

        // Muestra la cantidad de equipos diferentes que fueron campeones.
        // length indica la cantidad de elementos del arreglo.
        document.getElementById("total-campeones").textContent =
            rankingOrdenado.length;

        // Muestra la cantidad de equipos con el texto correspondiente.
        // El operador ternario permite elegir entre "equipo" y "equipos".
        document.getElementById("cantidad-equipos").textContent =
            `${rankingOrdenado.length} ${
                rankingOrdenado.length === 1 ? "equipo" : "equipos"
            }`;


        // ========================================================
        // OBTENER LOS ELEMENTOS DEL RECUADRO DEL LÍDER
        // ========================================================

        // Busca los elementos HTML donde se mostrarán:
        // - El nombre del máximo ganador.
        // - Su escudo.
        // - Su cantidad de títulos.
        const nombreLider = document.getElementById("nombre-lider");
        const escudoLider = document.getElementById("escudo-lider");
        const titulosLider = document.getElementById("titulos-lider");


        // Comprueba si hay al menos un equipo con títulos confirmados.
        if (rankingOrdenado.length > 0) {

            // Obtiene el primer equipo del ranking.
            // Como está ordenado de mayor a menor, es el que más títulos tiene.
            const lider = rankingOrdenado[0];

            // Muestra el nombre del equipo líder.
            nombreLider.textContent = lider.equipo;

            // Muestra su cantidad de títulos.
            // El operador ternario diferencia entre singular y plural.
            titulosLider.textContent =
                `${lider.cantidad} ${
                    lider.cantidad === 1 ? "título" : "títulos"
                }`;

            // Carga el escudo del equipo utilizando la función rutaEscudo.
            escudoLider.src = rutaEscudo(lider.equipo);

            // Texto alternativo de la imagen.
            escudoLider.alt = `Escudo de ${lider.equipo}`;

            // Se asegura de que el escudo esté visible.
            escudoLider.hidden = false;

            // Si no se encuentra el archivo del escudo, lo oculta.
            escudoLider.onerror = () => {
                escudoLider.hidden = true;
            };

        } else {

            // Si no hay campeones confirmados, muestra mensajes
            // indicando que todavía no hay información disponible.
            nombreLider.textContent = "Sin datos";
            titulosLider.textContent = "Sin títulos confirmados";

            // Oculta el escudo porque no hay un líder.
            escudoLider.hidden = true;
        }


        // ========================================================
        // PREPARAR EL CONTENEDOR DEL RANKING
        // ========================================================

        // Elimina las tarjetas anteriores para evitar duplicaciones.
        ranking.replaceChildren();

        // Si no hay equipos campeones, muestra un mensaje y termina.
        if (rankingOrdenado.length === 0) {
            ranking.textContent =
                "Todavía no hay campeones confirmados para esta competición.";

            return;
        }

        // Guarda la cantidad máxima de títulos.
        // Se utiliza para calcular el porcentaje de las barras.
        const maxTitulos = rankingOrdenado[0].cantidad;


        // ========================================================
        // CREAR LAS TARJETAS DEL RANKING
        // ========================================================

        // Recorre todos los campeones ordenados.
        //
        // campeon: representa al equipo actual.
        // indice: representa su posición dentro del arreglo (empieza en 0).
        rankingOrdenado.forEach((campeon, indice) => {

            // Crea el artículo HTML que funcionará como tarjeta.
            const tarjeta = document.createElement("article");

            // Le asigna la clase CSS correspondiente.
            tarjeta.className = "tarjeta-ranking";


            // ----------------------------------------------------
            // POSICIÓN EN EL RANKING
            // ----------------------------------------------------

            // Crea el elemento que mostrará el puesto del equipo.
            const puesto = document.createElement("span");

            // Le asigna su clase CSS.
            puesto.className = "puesto-ranking";

            // indice + 1 convierte la posición del arreglo en un puesto.
            // Ejemplo: índice 0 = puesto 1º.
            puesto.textContent = `${indice + 1}º`;


            // ----------------------------------------------------
            // ESCUDO DEL EQUIPO
            // ----------------------------------------------------

            // Crea una imagen para mostrar el escudo.
            const escudo = document.createElement("img");

            // Le asigna su clase CSS.
            escudo.className = "escudo-ranking";

            // Obtiene la ruta del escudo utilizando rutaEscudo.
            escudo.src = rutaEscudo(campeon.equipo);

            // Texto alternativo de la imagen.
            escudo.alt = `Escudo de ${campeon.equipo}`;

            // Carga la imagen cuando esté cerca de aparecer en pantalla.
            escudo.loading = "lazy";

            // Si no se encuentra el archivo del escudo, lo oculta.
            escudo.onerror = () => {
                escudo.hidden = true;
            };


            // ----------------------------------------------------
            // INFORMACIÓN DEL EQUIPO
            // ----------------------------------------------------

            // Crea un contenedor para agrupar el nombre,
            // la barra de progreso y las temporadas.
            const informacion = document.createElement("div");

            // Le asigna su clase CSS.
            informacion.className = "informacion-ranking";

            // Crea el encabezado donde se mostrará el nombre del equipo.
            const equipo = document.createElement("h3");

            // Le asigna su clase CSS.
            equipo.className = "nombre-ranking";

            // Introduce el nombre del equipo.
            equipo.textContent = campeon.equipo;


            // ----------------------------------------------------
            // BARRA DE PROGRESO
            // ----------------------------------------------------

            // Crea el fondo de la barra.
            const barraFondo = document.createElement("div");

            // Le asigna su clase CSS.
            barraFondo.className = "barra-fondo";

            // Crea la parte de la barra que se llenará.
            const barra = document.createElement("div");

            // Le asigna su clase CSS.
            barra.className = "barra-progreso";

            // Calcula el porcentaje que debe ocupar la barra.
            //
            // Se divide la cantidad de títulos del equipo por el
            // máximo de títulos del ranking y se multiplica por 100.
            //
            // Ejemplo:
            // Si el líder tiene 20 títulos y otro equipo tiene 10:
            // (10 / 20) * 100 = 50%.
            barra.style.width =
                `${(campeon.cantidad / maxTitulos) * 100}%`;

            // Coloca la parte que se llena dentro del fondo.
            barraFondo.append(barra);


            // ----------------------------------------------------
            // TEMPORADAS EN LAS QUE FUE CAMPEÓN
            // ----------------------------------------------------

            // Crea un párrafo para mostrar los años de cada equipo.
            const temporadas = document.createElement("p");

            // Le asigna su clase CSS.
            temporadas.className = "temporadas-ranking";

            // Set elimina los años repetidos.
            // [... ] convierte los valores en un arreglo.
            // sort los ordena cronológicamente.
            //
            // String convierte los valores a texto antes de compararlos.
            // numeric: true permite ordenar correctamente los números.
            const aniosOrdenados = [...new Set(campeon.anios)]
                .sort((a, b) =>
                    String(a).localeCompare(
                        String(b),
                        "es",
                        { numeric: true }
                    )
                );

            // Si hay años registrados, los muestra separados por " · ".
            // Si no hay ninguno, muestra un mensaje alternativo.
            temporadas.textContent = aniosOrdenados.length
                ? aniosOrdenados.join(" · ")
                : "Años no registrados";


            // Agrega el nombre, la barra y las temporadas
            // dentro del contenedor de información.
            informacion.append(equipo, barraFondo, temporadas);


            // ----------------------------------------------------
            // CANTIDAD DE TÍTULOS
            // ----------------------------------------------------

            // Crea un elemento para destacar la cantidad de títulos.
            const cantidad = document.createElement("strong");

            // Le asigna su clase CSS.
            cantidad.className = "cantidad-ranking";

            // Muestra la cantidad de títulos con singular o plural.
            cantidad.textContent =
                `${campeon.cantidad} ${
                    campeon.cantidad === 1 ? "título" : "títulos"
                }`;


            // ----------------------------------------------------
            // ARMAR Y MOSTRAR LA TARJETA
            // ----------------------------------------------------

            // Coloca todos los elementos dentro de la tarjeta:
            // puesto, escudo, información y cantidad de títulos.
            tarjeta.append(puesto, escudo, informacion, cantidad);

            // Agrega la tarjeta terminada al ranking de la página.
            ranking.append(tarjeta);
        });


    } catch (error) {

        // Si ocurre algún error durante la carga o el procesamiento,
        // lo muestra en la consola del navegador.
        console.error("Error al cargar el palmarés:", error);

        // También muestra un mensaje de error dentro de la página.
        ranking.textContent =
            "Error al cargar el historial: " + error.message;
    }
});


/*
    ============================================================
    CONSTRUIR LA RUTA DEL ESCUDO
    ============================================================

    Recibe el nombre de un equipo y lo transforma para que coincida
    con el nombre del archivo de su escudo.

    Ejemplo:
    "Atlético Tucumán" -> "atletico-tucuman"

    Finalmente devuelve la ruta completa de la imagen.
*/
function rutaEscudo(nombre) {

    // Transforma el nombre del equipo para obtener el nombre del archivo.
    const archivo = nombre

        // Separa las letras de sus acentos.
        .normalize("NFD")

        // Elimina los acentos y otros signos diacríticos.
        .replace(/[\u0300-\u036f]/g, "")

        // Convierte todas las letras a minúsculas.
        .toLowerCase()

        // Elimina espacios al principio y al final.
        .trim()

        // Reemplaza caracteres que no sean letras o números por guiones.
        .replace(/[^a-z0-9]+/g, "-")

        // Elimina guiones que hayan quedado al principio o al final.
        .replace(/^-|-$/g, "");

    // Devuelve la ruta de la imagen del escudo.
    // Ejemplo: ../IMG/Escudos/atletico-tucuman.png
    return `../IMG/Escudos/${archivo}.png`;
}
