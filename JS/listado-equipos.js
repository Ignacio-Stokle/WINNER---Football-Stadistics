/*
    ============================================================
    CARGA INICIAL DE LA PÁGINA
    ============================================================

    DOMContentLoaded es un evento que se ejecuta cuando el HTML
    ya fue completamente interpretado por el navegador.

    De esta manera, nos aseguramos de que los elementos HTML
    existan antes de intentar buscarlos o modificarlos.

    async permite utilizar await dentro de la función.
    Esto es necesario porque la carga de datos es una operación
    asíncrona: puede tardar un tiempo en completarse.
*/
document.addEventListener("DOMContentLoaded", async () => {

    // Busca el elemento que contiene la página de equipos.
    // Se identifica mediante el ID "pagina-equipos".
    const pagina = document.getElementById("pagina-equipos");

    // Busca el contenedor donde se insertarán las tarjetas de equipos.
    const lista = document.getElementById("lista-equipos");

    // Busca el enlace que permite acceder a la sección del ranking.
    // querySelector busca el primer elemento que coincida con la clase indicada.
    const botonRanking = document.querySelector(".boton-ranking");

    // Busca la sección completa del ranking de trofeos.
    const seccionRanking = document.getElementById("seccion-ranking-trofeos");

    /*
        VALIDAR ELEMENTOS PRINCIPALES

        Comprueba que existan los dos elementos necesarios para
        mostrar el listado de equipos.

        El operador || significa "O".

        Si pagina no existe O lista no existe, se ejecuta return
        y se detiene la función.
    */
    if (!pagina || !lista) return;

    // Obtiene el valor del atributo data-region del elemento pagina.
    // Por ejemplo, si el HTML tiene data-region="Argentina",
    // la variable region contendrá "Argentina".
    const region = pagina.dataset.region;

    /*
        TRY / CATCH

        try permite ejecutar un bloque de código que podría producir
        errores.

        Si ocurre un error dentro del try, la ejecución pasa al catch,
        donde podemos informar qué salió mal.
    */
    try {

        // CARGAR LOS DATOS

        // Llama a cargarDatos(), que obtiene la información necesaria
        // desde Google Sheets.
        //
        // await espera a que la promesa termine antes de continuar.
        // El resultado se guarda en la variable datos.
        const datos = await cargarDatos();

        // Genera el ranking de trofeos utilizando los equipos
        // y títulos obtenidos desde Google Sheets.
        generarRankingTrofeos(datos);


        // ========================================================
        // FILTRAR EQUIPOS POR REGIÓN
        // ========================================================

        // filter() recorre el arreglo datos.equipos y devuelve
        // un nuevo arreglo con los elementos que cumplen la condición.
        const equipos = datos.equipos.filter(e =>

            // Obtiene la región o categoría del equipo.
            // obtenerCampo() permite buscar el dato utilizando
            // cualquiera de los nombres de columna indicados.
            //
            // normalizar() transforma el texto para facilitar
            // la comparación, evitando diferencias de formato.
            normalizar(
                obtenerCampo(
                    e,
                    "Región",
                    "Region",
                    "Categoría",
                    "Categoria"
                )
            ) === normalizar(region)

            // Solo se conservan los equipos cuya región coincida
            // con la región indicada en el HTML.
        );


        // ========================================================
        // ORDENAR LOS EQUIPOS ALFABÉTICAMENTE
        // ========================================================

        // sort() ordena los elementos del arreglo.
        // Se comparan los nombres de dos equipos a la vez.
        const equiposOrdenados = equipos.sort((a, b) =>

            // Obtiene los nombres de ambos equipos y los compara.
            //
            // localeCompare() realiza una comparación de textos
            // teniendo en cuenta las reglas del idioma indicado.
            //
            // "es" indica que se utilicen las reglas del español.
            obtenerCampo(a, "Equipo", "Nombre").localeCompare(
                obtenerCampo(b, "Equipo", "Nombre"),
                "es"
            )
        );


        // ========================================================
        // LIMPIAR EL LISTADO
        // ========================================================

        // replaceChildren() elimina todos los elementos hijos
        // del contenedor lista.
        //
        // Esto evita que queden tarjetas anteriores si el listado
        // se vuelve a generar.
        lista.replaceChildren();


        // ========================================================
        // COMPROBAR SI HAY EQUIPOS
        // ========================================================

        // length devuelve la cantidad de elementos de un arreglo.
        // Si es igual a 0, significa que no se encontraron equipos.
        if (equiposOrdenados.length === 0) {

            // Muestra un mensaje dentro del listado.
            lista.textContent =
                "No se encontraron equipos. Revisá la columna Región de Google Sheets.";

            // Detiene la ejecución para no intentar crear tarjetas.
            return;
        }


        // ========================================================
        // RECORRER Y CREAR LAS TARJETAS DE LOS EQUIPOS
        // ========================================================

        // forEach() ejecuta una función por cada elemento del arreglo.
        // En este caso, se ejecutará una vez por cada equipo.
        equiposOrdenados.forEach(equipo => {

            // Obtiene el nombre del equipo actual.
            const nombre = obtenerCampo(equipo, "Equipo", "Nombre");


            // ----------------------------------------------------
            // CREAR EL BOTÓN DE LA TARJETA
            // ----------------------------------------------------

            // Crea un elemento HTML <button>.
            const tarjeta = document.createElement("button");

            // type="button" evita que el botón actúe como un botón
            // de envío de formulario si está dentro de uno.
            tarjeta.type = "button";

            // Le asigna la clase CSS que determina su apariencia.
            tarjeta.className = "tarjeta-equipo";


            // ----------------------------------------------------
            // CREAR LA IMAGEN DEL ESCUDO
            // ----------------------------------------------------

            // Crea un elemento HTML <img>.
            const escudo = document.createElement("img");

            // Le asigna la clase CSS correspondiente al escudo.
            escudo.className = "escudo-equipo";

            // Construye la ruta de la imagen utilizando el nombre
            // del equipo transformado por nombreArchivoEscudo().
            //
            // Las comillas invertidas permiten insertar variables
            // dentro de un texto mediante ${}.
            escudo.src = `../IMG/escudos/${nombreArchivoEscudo(nombre)}.png`;

            // alt es un texto alternativo que describe la imagen.
            // También resulta útil para lectores de pantalla.
            escudo.alt = `Escudo de ${nombre}`;

            // lazy indica que la imagen puede cargarse cuando
            // esté cerca de aparecer en la pantalla.
            // Esto ayuda a evitar cargar todas las imágenes de golpe.
            escudo.loading = "lazy";


            // ----------------------------------------------------
            // CONTROLAR ERRORES AL CARGAR EL ESCUDO
            // ----------------------------------------------------

            // onerror se ejecuta si el navegador no puede cargar
            // la imagen indicada en src.
            escudo.onerror = () => {

                // Muestra una advertencia en la consola.
                // Permite identificar qué escudo no se encontró.
                console.warn(`No se encontró el escudo de ${nombre}: ${escudo.src}`);

                // Oculta la imagen para que no quede un espacio
                // con una imagen rota dentro de la tarjeta.
                escudo.hidden = true;
            };


            // ----------------------------------------------------
            // CREAR EL TEXTO CON EL NOMBRE DEL EQUIPO
            // ----------------------------------------------------

            // Crea un elemento HTML <span>.
            const texto = document.createElement("span");

            // Le asigna la clase CSS correspondiente.
            texto.className = "nombre-equipo";

            // textContent establece el contenido de texto del elemento.
            texto.textContent = nombre;


            // ----------------------------------------------------
            // ORGANIZAR LOS ELEMENTOS DE LA TARJETA
            // ----------------------------------------------------

            // append() agrega los elementos indicados como hijos
            // de tarjeta, respetando el orden recibido.
            //
            // Primero se agrega el escudo y después el nombre.
            tarjeta.append(escudo, texto);


            // ----------------------------------------------------
            // EVENTO AL HACER CLIC EN UNA TARJETA
            // ----------------------------------------------------

            // addEventListener() permite asociar una acción
            // a un evento determinado.
            //
            // En este caso, el evento es "click".
            tarjeta.addEventListener("click", () => {

                // Al hacer clic, llama a mostrarPerfilEquipo()
                // y le pasa dos argumentos:
                //
                // equipo: los datos del equipo seleccionado.
                // datos: el conjunto completo de datos cargados.
                mostrarPerfilEquipo(equipo, datos);
            });


            // ----------------------------------------------------
            // AGREGAR LA TARJETA AL LISTADO
            // ----------------------------------------------------

            // Inserta la tarjeta terminada dentro del contenedor lista.
            lista.append(tarjeta);
        });


        // ========================================================
        // CONFIGURAR EL BOTÓN PARA VOLVER AL LISTADO
        // ========================================================

        // Busca el botón que permite regresar desde el perfil
        // de un equipo hacia el listado general.
        const botonVolver = document.getElementById("volver-equipos");


        // EVENTO PARA VOLVER AL LISTADO.
        if (botonVolver) {

            // Cuando se hace clic en el botón, ejecuta esta función.
            botonVolver.addEventListener("click", () => {

                // Busca el perfil del equipo y lo oculta.
                document.getElementById("perfil-equipo").hidden = true;

                // Vuelve a mostrar el listado de equipos.
                lista.hidden = false;


                // ------------------------------------------------
                // VOLVER A MOSTRAR EL RANKING
                // ------------------------------------------------

                // Comprueba que la sección del ranking exista.
                if (seccionRanking) {

                    // La muestra nuevamente.
                    seccionRanking.hidden = false;
                }

                // Comprueba que el botón del ranking exista.
                if (botonRanking) {

                    // Lo muestra nuevamente.
                    botonRanking.hidden = false;
                }
            });
        }


    } catch (error) {

        /*
            MANEJO DE ERRORES

            Si alguna operación dentro del try falla,
            la ejecución llega hasta este bloque.

            error contiene información sobre el problema ocurrido.
        */

        // Muestra el error completo en la consola del navegador.
        console.error(error);

        // Muestra un mensaje dentro del listado de equipos.
        // error.message contiene una descripción del error.
        lista.textContent =
            "No se pudieron cargar los equipos: " + error.message;
    }
});


/*
    ============================================================
    MOSTRAR PERFIL DE UN EQUIPO
    ============================================================

    Esta función se ejecuta cuando el usuario hace clic
    sobre una tarjeta de equipo.

    PARÁMETROS:

    equipo:
        Objeto que contiene los datos del equipo seleccionado.

    datos:
        Objeto que contiene todos los datos cargados desde
        Google Sheets, incluidos los títulos.

    FUNCIONAMIENTO:

    1. Obtiene el nombre y el escudo del equipo.
    2. Oculta el ranking de trofeos.
    3. Busca los títulos confirmados del equipo.
    4. Agrupa los títulos por competición.
    5. Muestra la información del equipo.
*/
function mostrarPerfilEquipo(equipo, datos) {

    // Obtiene el nombre del equipo seleccionado.
    const nombre = obtenerCampo(equipo, "Equipo", "Nombre");


    // ========================================================
    // BUSCAR LOS ELEMENTOS HTML DEL PERFIL
    // ========================================================

    // Busca el contenedor completo del perfil.
    const perfil = document.getElementById("perfil-equipo");

    // Busca el contenedor donde se muestran las tarjetas.
    const lista = document.getElementById("lista-equipos");

    // Busca el contenedor donde se mostrarán los títulos.
    const listaTitulos = document.getElementById("lista-titulos");

    // Busca el elemento que mostrará el nombre del equipo.
    const nombreEquipo = document.getElementById("nombre-equipo");


    // ========================================================
    // MOSTRAR EL NOMBRE DEL EQUIPO
    // ========================================================

    // Reemplaza el contenido de texto del elemento por el nombre
    // del equipo seleccionado.
    nombreEquipo.textContent = nombre;


    // ========================================================
    // BUSCAR O CREAR LA IMAGEN DEL ESCUDO
    // ========================================================

    // Busca si ya existe una imagen con este ID.
    // let permite modificar la variable si fuera necesario.
    let escudoPerfil = document.getElementById("escudo-perfil-equipo");

    // Si no existe una imagen con ese ID, entra en el if.
    if (!escudoPerfil) {

        // Crea un nuevo elemento HTML <img>.
        escudoPerfil = document.createElement("img");

        // Le asigna un ID para poder encontrarlo posteriormente.
        escudoPerfil.id = "escudo-perfil-equipo";

        // Le asigna la clase CSS que controla su apariencia.
        escudoPerfil.className = "escudo-perfil-equipo";

        // Inserta la imagen inmediatamente antes del nombre del equipo.
        //
        // "beforebegin" indica que el nuevo elemento se coloca
        // como hermano anterior de nombreEquipo, no dentro de él.
        nombreEquipo.insertAdjacentElement("beforebegin", escudoPerfil);
    }


    // --------------------------------------------------------
    // CONFIGURAR LA IMAGEN DEL ESCUDO
    // --------------------------------------------------------

    // Establece la ruta del archivo del escudo.
    escudoPerfil.src = `../IMG/Escudos/${nombreArchivoEscudo(nombre)}.png`;

    // Texto alternativo de la imagen.
    escudoPerfil.alt = `Escudo de ${nombre}`;

    // Asegura que la imagen esté visible.
    escudoPerfil.hidden = false;


    // --------------------------------------------------------
    // CONTROLAR SI EL ESCUDO NO SE ENCUENTRA
    // --------------------------------------------------------

    // Si el navegador no puede cargar la imagen,
    // oculta el elemento para evitar mostrar una imagen rota.
    escudoPerfil.onerror = () => {
        escudoPerfil.hidden = true;
    };


    // ========================================================
    // OCULTAR EL RANKING DE TROFEOS
    // ========================================================

    // Busca la sección completa del ranking.
    //
    // Se vuelve a buscar aquí porque esta función está definida
    // fuera del callback DOMContentLoaded y no puede acceder
    // directamente a sus variables locales.
    const seccionRanking = document.getElementById("seccion-ranking-trofeos");

    // Comprueba que la sección exista antes de modificarla.
    if (seccionRanking) {

        // hidden=true oculta el elemento HTML.
        seccionRanking.hidden = true;
    }


    // --------------------------------------------------------
    // OCULTAR EL BOTÓN DEL RANKING
    // --------------------------------------------------------

    // Busca el enlace que permite acceder al ranking.
    const botonRanking = document.querySelector(".boton-ranking");

    // Comprueba que el botón exista.
    if (botonRanking) {

        // Lo oculta mientras se está mostrando el perfil.
        botonRanking.hidden = true;
    }


    // ========================================================
    // BUSCAR LOS TÍTULOS DEL EQUIPO
    // ========================================================

    // filter() recorre todos los títulos y devuelve un nuevo
    // arreglo que contiene únicamente los que cumplen la condición.
    const titulos = datos.titulos.filter(t => {

        // Obtiene el nombre del equipo asociado al título.
        // La columna puede llamarse "Equipo" o "Club".
        const equipoTitulo = obtenerCampo(t, "Equipo", "Club");

        /*
            La condición tiene dos partes:

            1. El nombre del equipo del título debe coincidir
               con el equipo cuyo perfil estamos mostrando.

            2. El título debe estar confirmado.

            && significa "Y": ambas condiciones deben cumplirse
            para que el título sea incluido en el resultado.
        */
        return (
            normalizar(equipoTitulo) === normalizar(nombre) &&
            tituloConfirmado(t)
        );
    });


    // ========================================================
    // MOSTRAR LA CANTIDAD TOTAL DE TÍTULOS
    // ========================================================

    // Busca el elemento con ID "total-titulos".
    // length devuelve la cantidad de títulos encontrados.
    document.getElementById("total-titulos").textContent = titulos.length;


    // ========================================================
    // LIMPIAR LA LISTA DE TÍTULOS
    // ========================================================

    // Elimina todos los elementos que ya estén dentro del contenedor.
    // Así evitamos repetir títulos cuando se abre otro equipo.
    listaTitulos.replaceChildren();


    // ========================================================
    // AGRUPAR LOS TÍTULOS POR COMPETICIÓN
    // ========================================================

    // Map es una estructura que permite guardar pares de clave y valor.
    //
    // En este caso:
    // Clave: nombre de la competición.
    // Valor: arreglo con los años en los que se ganó esa competición.
    //
    // Ejemplo:
    // "Liga Argentina" -> ["2020", "2022", "2024"]
    const titulosPorCompeticion = new Map();


    // Recorre todos los títulos confirmados del equipo.
    titulos.forEach(t => {

        // Obtiene el nombre de la competición.
        // Puede estar guardado en una columna llamada
        // "Competición" o "Torneo".
        const competicion = obtenerCampo(
            t,
            "Competición",
            "Torneo"
        );

        // Obtiene el año o temporada del título.
        // Se contemplan distintos nombres posibles para la columna.
        const anio = obtenerCampo(
            t,
            "Año / temporada",
            "Año",
            "Temporada"
        );


        // ----------------------------------------------------
        // COMPROBAR SI LA COMPETICIÓN YA ESTÁ REGISTRADA
        // ----------------------------------------------------

        // has() comprueba si el Map ya tiene una clave determinada.
        if (!titulosPorCompeticion.has(competicion)) {

            // Si todavía no existe, la agrega con un arreglo vacío.
            //
            // set() agrega o modifica un par clave-valor dentro del Map.
            titulosPorCompeticion.set(competicion, []);
        }


        // ----------------------------------------------------
        // AGREGAR EL AÑO A LA COMPETICIÓN CORRESPONDIENTE
        // ----------------------------------------------------

        // get() obtiene el valor asociado a una clave.
        // En este caso, devuelve el arreglo de años de esa competición.
        //
        // push() agrega el nuevo año al final de ese arreglo.
        titulosPorCompeticion.get(competicion).push(anio);
    });


    // ========================================================
    // COMPROBAR SI EL EQUIPO TIENE TÍTULOS
    // ========================================================

    // Si el arreglo está vacío, significa que no se encontró
    // ningún título confirmado para el equipo.
    if (titulos.length === 0) {

        // Muestra un mensaje en el contenedor de títulos.
        listaTitulos.textContent =
            "Este equipo todavía no tiene títulos confirmados.";
    }


    // ========================================================
    // ORDENAR LAS COMPETICIONES ALFABÉTICAMENTE
    // ========================================================

    // keys() devuelve todas las claves del Map.
    // En este caso, devuelve los nombres de las competiciones.
    //
    // El operador spread (...) convierte esas claves en un arreglo.
    // De esta manera podemos utilizar sort() para ordenarlas.
    const competicionesOrdenadas = [...titulosPorCompeticion.keys()]

        // Ordena los nombres de las competiciones alfabéticamente.
        .sort((a, b) => a.localeCompare(b, "es"));


    // ========================================================
    // RECORRER LAS COMPETICIONES ORDENADAS
    // ========================================================

    // forEach() ejecuta la función una vez por cada competición.
    competicionesOrdenadas.forEach(competicion => {

        // Obtiene el arreglo de años correspondiente a la competición.
        const anios = titulosPorCompeticion.get(competicion);


        // ----------------------------------------------------
        // ORDENAR LOS AÑOS DE MÁS ANTIGUO A MÁS RECIENTE
        // ----------------------------------------------------

        // sort() ordena los años.
        //
        // localeCompare() compara los valores como texto.
        // La opción numeric: true hace que los números se comparen
        // teniendo en cuenta su valor numérico.
        //
        // Por ejemplo, permite ordenar 1999 antes que 2005,
        // en lugar de compararlos únicamente carácter por carácter.
        anios.sort((a, b) =>
            a.localeCompare(b, "es", { numeric: true })
        );


        // ====================================================
        // CREAR LA FILA DE LA COMPETICIÓN
        // ====================================================

        // Crea un elemento HTML <article>.
        // Este elemento contendrá el nombre de la competición
        // y los años en los que el equipo la ganó.
        const fila = document.createElement("article");

        // Asigna la clase CSS que determina su apariencia.
        fila.className = "fila-titulo";


        // ----------------------------------------------------
        // CREAR EL NOMBRE DE LA COMPETICIÓN
        // ----------------------------------------------------

        // Crea un elemento <strong>, que muestra texto destacado.
        const nombreCompeticion = document.createElement("strong");

        // Establece el nombre de la competición seguido de dos puntos.
        nombreCompeticion.textContent = competicion + ": ";


        // ----------------------------------------------------
        // CREAR EL TEXTO CON LOS AÑOS
        // ----------------------------------------------------

        // Crea un elemento <span> para mostrar los años.
        const aniosTexto = document.createElement("span");

        // join() convierte todos los elementos del arreglo en un texto.
        // El separador elegido es una coma y un espacio.
        //
        // Ejemplo:
        // ["2020", "2022", "2024"] -> "2020, 2022, 2024"
        const aniosEnTexto = anios.join(", ");

        // Coloca el texto generado dentro del span.
        aniosTexto.textContent = aniosEnTexto;


        // ----------------------------------------------------
        // ORGANIZAR Y AGREGAR LA FILA
        // ----------------------------------------------------

        // Agrega el nombre de la competición y los años
        // como elementos hijos de la fila.
        fila.append(nombreCompeticion, aniosTexto);

        // Inserta la fila terminada dentro de la lista de títulos.
        listaTitulos.append(fila);
    });


    // ========================================================
    // CAMBIAR DE VISTA: LISTADO -> PERFIL
    // ========================================================

    // Oculta el listado general de equipos.
    lista.hidden = true;

    // Muestra el perfil del equipo seleccionado.
    perfil.hidden = false;
}


/*
    ============================================================
    CONVERTIR NOMBRES DE EQUIPOS EN NOMBRES DE ARCHIVOS
    ============================================================

    PARÁMETRO:
        nombre: nombre original del equipo.

    OBJETIVO:
        Transformar el nombre para que coincida con el formato
        utilizado en los nombres de los archivos de escudos.

    EJEMPLO:
        "Atlético Tucumán" -> "atletico-tucuman"

    Esto permite construir las rutas de las imágenes sin tener
    que escribir manualmente el nombre de cada archivo.
*/
function nombreArchivoEscudo(nombre) {

    // Devuelve el resultado de encadenar varias transformaciones
    // sobre el texto recibido.
    return nombre

        // normalize("NFD") separa los caracteres de sus acentos.
        //
        // Por ejemplo, "á" se transforma en:
        // "a" + una marca de acento.
        .normalize("NFD")

        // Elimina las marcas de acentuación.
        //
        // La expresión regular busca todos los caracteres
        // Unicode que representan marcas diacríticas.
        .replace(/[\u0300-\u036f]/g, "")

        // Convierte todas las letras a minúsculas.
        .toLowerCase()

        // Elimina los espacios que pueda haber al principio
        // o al final del nombre.
        .trim()

        // Reemplaza cualquier grupo de caracteres que no sea
        // una letra de la a a la z o un número por un guion.
        //
        // El signo + indica que puede haber uno o más caracteres
        // consecutivos que deben reemplazarse.
        .replace(/[^a-z0-9]+/g, "-")

        // Elimina un posible guion al principio o al final.
        //
        // ^- busca un guion al comienzo.
        // -$ busca un guion al final.
        .replace(/^-|-$/g, "");
}


/*
    ============================================================
    GENERAR RANKING DE TROFEOS
    ============================================================

    PARÁMETRO:
        datos: objeto con los equipos y títulos cargados
        desde Google Sheets.

    OBJETIVO:

    1. Obtener los equipos argentinos.
    2. Contar sus títulos confirmados.
    3. Ordenarlos según la cantidad de títulos.
    4. Identificar al líder.
    5. Mostrar las tarjetas del ranking con sus posiciones,
       escudos, nombres, barras de progreso y cantidades.
*/
function generarRankingTrofeos(datos) {

    // Busca el contenedor HTML donde se mostrarán las tarjetas.
    const ranking = document.getElementById("ranking-trofeos");

    // Si el contenedor no existe en esta página, termina la función.
    // Esto permite reutilizar el archivo JS en páginas que no tengan ranking.
    if (!ranking) return;


    // ========================================================
    // OBTENER EXCLUSIVAMENTE LOS EQUIPOS ARGENTINOS
    // ========================================================

    // filter() recorre todos los equipos y devuelve un nuevo arreglo
    // con aquellos cuya región o categoría sea Argentina.
    const equiposArgentinos = datos.equipos.filter(e =>

        // Obtiene la región o categoría del equipo.
        // normalizar() permite comparar los textos sin depender
        // de diferencias de mayúsculas, acentos o espacios.
        normalizar(
            obtenerCampo(e, "Región", "Region", "Categoría", "Categoria")
        ) === "argentina"
    );


    // ========================================================
    // PREPARAR EL CONTADOR DE TÍTULOS
    // ========================================================

    // Crea un Map que relaciona cada equipo con su cantidad de títulos.
    //
    // Cada elemento tendrá:
    // - equipo: nombre original del equipo.
    // - cantidad: cantidad de títulos confirmados.
    //
    // La clave del Map será el nombre normalizado del equipo.
    const campeones = new Map();


    // ========================================================
    // REGISTRAR LOS EQUIPOS ARGENTINOS
    // ========================================================

    // Recorre todos los equipos argentinos.
    equiposArgentinos.forEach(equipo => {

        // Obtiene el nombre del equipo.
        const nombre = obtenerCampo(equipo, "Equipo", "Nombre");

        // Si el equipo no tiene nombre, se ignora ese registro.
        //
        // return dentro de esta función flecha detiene únicamente
        // la ejecución de esta vuelta del forEach y pasa al siguiente.
        if (!nombre) return;

        // Agrega el equipo al Map.
        //
        // normalizar(nombre) se utiliza como clave para poder
        // comparar nombres aunque tengan diferencias de formato.
        //
        // La cantidad inicial es 0 porque todavía no contamos
        // sus títulos.
        campeones.set(normalizar(nombre), {
            equipo: nombre,
            cantidad: 0
        });
    });


    // ========================================================
    // CONTAR LOS TÍTULOS CONFIRMADOS
    // ========================================================

    // Recorre todos los títulos obtenidos desde Google Sheets.
    datos.titulos.forEach(titulo => {

        // Comprueba si el título está confirmado.
        // Si no lo está, lo ignora y continúa con el siguiente.
        if (!tituloConfirmado(titulo)) return;

        // Obtiene el nombre del equipo que ganó el título.
        const nombreEquipo = obtenerCampo(titulo, "Equipo", "Club");

        // Si el registro no tiene un equipo asociado, lo ignora.
        if (!nombreEquipo) return;

        // Normaliza el nombre para utilizarlo como clave del Map.
        const clave = normalizar(nombreEquipo);

        // Comprueba si el equipo está registrado entre los argentinos.
        if (campeones.has(clave)) {

            // get() obtiene el objeto asociado a esa clave.
            //
            // cantidad++ incrementa su cantidad de títulos en 1.
            //
            // Es equivalente a:
            // campeones.get(clave).cantidad =
            //     campeones.get(clave).cantidad + 1;
            campeones.get(clave).cantidad++;
        }
    });


    // ========================================================
    // ORDENAR LOS EQUIPOS SEGÚN LA CANTIDAD DE TÍTULOS
    // ========================================================

    // values() devuelve todos los valores almacenados en el Map.
    //
    // El operador spread (...) convierte esos valores en un arreglo,
    // lo que permite utilizar filter() y sort().
    const rankingOrdenado = [...campeones.values()]

        // Elimina del ranking los equipos que no tienen títulos.
        .filter(e => e.cantidad > 0)

        // Ordena los equipos de mayor a menor cantidad de títulos.
        .sort((a, b) =>

            // Primero compara la cantidad de títulos.
            // b.cantidad - a.cantidad coloca los valores mayores primero.
            //
            // Si dos equipos tienen la misma cantidad,
            // se utiliza el nombre para ordenarlos alfabéticamente.
            b.cantidad - a.cantidad ||
            a.equipo.localeCompare(b.equipo, "es")
        );


    // ========================================================
    // LIMPIAR EL RANKING ANTERIOR
    // ========================================================

    // Elimina todas las tarjetas anteriores del contenedor.
    ranking.replaceChildren();


    // ========================================================
    // COMPROBAR SI HAY TÍTULOS CONFIRMADOS
    // ========================================================

    // Si el arreglo está vacío, significa que ningún equipo
    // tiene títulos confirmados para mostrar.
    if (rankingOrdenado.length === 0) {

        // Muestra un mensaje dentro del ranking.
        ranking.textContent = "Todavía no hay títulos confirmados.";

        // Actualiza el nombre del líder para indicar que no hay datos.
        document.getElementById("nombre-lider-trofeos").textContent =
            "Sin datos";

        // Termina la función porque no hay equipos para mostrar.
        return;
    }


    // ========================================================
    // IDENTIFICAR LA CANTIDAD MÁXIMA DE TÍTULOS
    // ========================================================

    // Como el ranking está ordenado de mayor a menor,
    // el primer equipo tiene la mayor cantidad de títulos.
    //
    // Esa cantidad se utilizará como referencia para calcular
    // el porcentaje de las barras de progreso.
    const maxTitulos = rankingOrdenado[0].cantidad;


    // ========================================================
    // IDENTIFICAR AL LÍDER
    // ========================================================

    // Obtiene el primer equipo del arreglo ordenado.
    const lider = rankingOrdenado[0];

    // Busca el elemento HTML donde se muestra el nombre del líder.
    // Luego reemplaza su contenido por el nombre correspondiente.
    document.getElementById("nombre-lider-trofeos").textContent =
        lider.equipo;


    // --------------------------------------------------------
    // MOSTRAR EL ESCUDO DEL LÍDER
    // --------------------------------------------------------

    // Busca la imagen destinada al escudo del líder.
    const escudoLider = document.getElementById("escudo-lider-trofeos");

    // Asegura que la imagen esté visible.
    escudoLider.hidden = false;

    // Construye la ruta del escudo utilizando el nombre del líder.
    escudoLider.src =
        `../IMG/escudos/${nombreArchivoEscudo(lider.equipo)}.png`;

    // Establece el texto alternativo de la imagen.
    escudoLider.alt = `Escudo de ${lider.equipo}`;


    // --------------------------------------------------------
    // CONTROLAR SI NO SE ENCUENTRA EL ESCUDO DEL LÍDER
    // --------------------------------------------------------

    // Si el navegador no puede cargar la imagen,
    // muestra un error en la consola y oculta el escudo.
    escudoLider.onerror = () => {

        // Informa qué archivo no se pudo encontrar.
        console.error("No se encontró el escudo del líder:", escudoLider.src);

        // Oculta la imagen rota.
        escudoLider.hidden = true;
    };


    // ========================================================
    // CREAR LAS TARJETAS DEL RANKING
    // ========================================================

    // Recorre los equipos ordenados.
    //
    // equipo representa el objeto del equipo actual.
    // indice representa su posición dentro del arreglo.
    //
    // El índice comienza en 0, por eso después se suma 1
    // para mostrar las posiciones desde el puesto 1.
    rankingOrdenado.forEach((equipo, indice) => {


        // ----------------------------------------------------
        // CREAR LA TARJETA
        // ----------------------------------------------------

        // Crea un elemento <article> para contener
        // toda la información del equipo.
        const tarjeta = document.createElement("article");

        // Asigna la clase CSS que determina su diseño.
        tarjeta.className = "ranking-trofeos__tarjeta";


        // ----------------------------------------------------
        // CREAR EL NÚMERO DE POSICIÓN
        // ----------------------------------------------------

        // Crea un elemento <span> para mostrar el puesto.
        const puesto = document.createElement("span");

        // Asigna la clase CSS correspondiente.
        puesto.className = "ranking-trofeos__puesto";

        // indice + 1 convierte la posición del arreglo
        // en una posición de ranking que comienza desde 1.
        //
        // Por ejemplo:
        // indice 0 -> 1º
        // indice 1 -> 2º
        // indice 2 -> 3º
        puesto.textContent = `${indice + 1}º`;


        // ----------------------------------------------------
        // CREAR EL ESCUDO DEL EQUIPO
        // ----------------------------------------------------

        // Crea un elemento <img> para mostrar el escudo.
        const escudo = document.createElement("img");

        // Asigna la clase CSS correspondiente.
        escudo.className = "ranking-trofeos__escudo";

        // Construye la ruta del escudo del equipo actual.
        escudo.src = `../IMG/escudos/${nombreArchivoEscudo(equipo.equipo)}.png`;

        // Texto alternativo de la imagen.
        escudo.alt = `Escudo de ${equipo.equipo}`;

        // Permite que el navegador cargue la imagen cuando
        // esté cerca de aparecer en pantalla.
        escudo.loading = "lazy";


        // ----------------------------------------------------
        // CONTROLAR ERRORES AL CARGAR EL ESCUDO
        // ----------------------------------------------------

        // Si el archivo no se encuentra, oculta la imagen.
        escudo.onerror = () => {
            escudo.hidden = true;
        };


        // ----------------------------------------------------
        // CREAR EL CONTENEDOR DE INFORMACIÓN
        // ----------------------------------------------------

        // Crea un <div> que agrupará el nombre del equipo
        // y su barra de progreso.
        const informacion = document.createElement("div");

        // Asigna la clase CSS correspondiente.
        informacion.className = "ranking-trofeos__informacion";


        // ----------------------------------------------------
        // CREAR EL NOMBRE DEL EQUIPO
        // ----------------------------------------------------

        // Crea un encabezado de nivel 3.
        const nombre = document.createElement("h3");

        // Asigna la clase CSS correspondiente.
        nombre.className = "ranking-trofeos__nombre";

        // Establece el nombre del equipo.
        nombre.textContent = equipo.equipo;


        // ----------------------------------------------------
        // CREAR EL FONDO DE LA BARRA DE PROGRESO
        // ----------------------------------------------------

        // Crea un <div> que funcionará como fondo de la barra.
        //
        // Dentro de este elemento se insertará otra barra
        // cuyo ancho dependerá de la cantidad de títulos.
        const barraFondo = document.createElement("div");

        // Asigna la clase CSS correspondiente al fondo.
        barraFondo.className = "ranking-trofeos__barra-fondo";


        // ----------------------------------------------------
        // CREAR LA BARRA DE PROGRESO
        // ----------------------------------------------------

        // Crea otro <div>, que será la parte visible de la barra.
        const barraProgreso = document.createElement("div");

        // Asigna la clase CSS correspondiente.
        barraProgreso.className = "ranking-trofeos__barra-progreso";


        // ----------------------------------------------------
        // CALCULAR EL ANCHO DE LA BARRA
        // ----------------------------------------------------

        // Calcula qué porcentaje de la barra debe ocupar el equipo.
        //
        // Se divide la cantidad de títulos del equipo actual
        // por la cantidad máxima de títulos del ranking.
        //
        // Después se multiplica por 100 para obtener un porcentaje.
        //
        // Ejemplo:
        // Líder: 20 títulos -> 100%.
        // Otro equipo: 10 títulos -> 50%.
        //
        // El resultado se asigna directamente al CSS mediante
        // style.width.
        barraProgreso.style.width =
            `${(equipo.cantidad / maxTitulos) * 100}%`;


        // ----------------------------------------------------
        // ORGANIZAR LA BARRA DE PROGRESO
        // ----------------------------------------------------

        // Inserta la barra de progreso dentro de su fondo.
        barraFondo.append(barraProgreso);


        // ----------------------------------------------------
        // CREAR EL TEXTO CON LA CANTIDAD DE TÍTULOS
        // ----------------------------------------------------

        // Crea un elemento <span> para mostrar la cantidad.
        const cantidad = document.createElement("span");

        // Asigna la clase CSS correspondiente.
        cantidad.className = "ranking-trofeos__cantidad";


        // Muestra la cantidad de títulos y adapta la palabra
        // según corresponda:
        //
        // Si cantidad es igual a 1, utiliza "título".
        // En cualquier otro caso, utiliza "títulos".
        //
        // El operador ternario tiene esta estructura:
        // condición ? resultado_si_se_cumple : resultado_si_no.
        cantidad.textContent =
            `${equipo.cantidad} ${equipo.cantidad === 1 ? "título" : "títulos"}`;


        // ====================================================
        // ORGANIZAR TODOS LOS ELEMENTOS DE LA TARJETA
        // ====================================================

        // Agrega el nombre y la barra de progreso al contenedor
        // de información.
        informacion.append(nombre, barraFondo);

        // Agrega todos los elementos a la tarjeta:
        // 1. Puesto.
        // 2. Escudo.
        // 3. Información (nombre y barra).
        // 4. Cantidad de títulos.
        tarjeta.append(puesto, escudo, informacion, cantidad);

        // Finalmente, agrega la tarjeta completa al ranking.
        ranking.append(tarjeta);
    });
}