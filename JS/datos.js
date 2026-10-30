
/*
    ============================================================
    URL DE LAS HOJAS DE GOOGLE SHEETS
    ============================================================

    Este objeto almacena las direcciones de las tres hojas
    publicadas como archivos CSV.

    Cada propiedad corresponde a una hoja diferente:

    - equipos: contiene la información de los equipos.
    - competiciones: contiene la información de los torneos.
    - titulos: contiene los campeonatos obtenidos por los equipos.

    De esta manera, si cambia alguna dirección, solamente hay
    que modificarla en este objeto.
*/
const URLS_PALMARES = {

    // URL de la hoja que contiene los equipos.
    equipos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=1209858657&single=true&output=csv",

    // URL de la hoja que contiene las competiciones.
    competiciones: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=359945927&single=true&output=csv",

    // URL de la hoja que contiene los títulos.
    titulos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=101958128&single=true&output=csv"
};


/*
    ============================================================
    NORMALIZAR TEXTOS
    ============================================================

    Recibe un texto y lo transforma para facilitar las comparaciones.

    El resultado:
    - No tiene espacios al principio ni al final.
    - Está escrito en minúsculas.
    - No tiene tildes ni acentos.

    Ejemplo:
    "  Atlético Tucumán " -> "atletico tucuman"

    Esto permite comparar nombres aunque estén escritos
    con diferencias de mayúsculas o tildes.
*/
function normalizar(valor) {

    return String(valor ?? "")

        // Convierte el valor recibido en texto.
        // Si es null o undefined, utiliza un texto vacío.
        .trim()

        // Elimina espacios al principio y al final.
        .toLocaleLowerCase("es")

        // Convierte el texto a minúsculas respetando el idioma español.
        .normalize("NFD")

        // Elimina los acentos y otros signos diacríticos.
        .replace(/[\u0300-\u036f]/g, "");
}


/*
    ============================================================
    OBTENER UN CAMPO DE UNA FILA
    ============================================================

    Recibe:
    - fila: un objeto que contiene los datos de una fila.
    - nombres: los posibles nombres de la columna que buscamos.

    Devuelve el primer campo que exista y que no esté vacío.

    Esto permite trabajar con distintas versiones de los nombres
    de las columnas de Google Sheets.

    Ejemplo:
    obtenerCampo(equipo, "Equipo", "Nombre")

    Primero busca "Equipo". Si no existe o está vacío,
    intenta buscar "Nombre".
*/
function obtenerCampo(fila, ...nombres) {

    // Recorre todos los nombres de columna recibidos.
    for (const nombre of nombres) {

        // Comprueba tres condiciones:
        // 1. Que la fila exista.
        // 2. Que el campo no sea undefined ni null.
        // 3. Que el contenido no esté vacío o tenga solamente espacios.
        if (
            fila &&
            fila[nombre] !== undefined &&
            fila[nombre] !== null &&
            String(fila[nombre]).trim() !== ""
        ) {

            // Devuelve el contenido del primer campo válido,
            // convertido a texto y sin espacios sobrantes.
            return String(fila[nombre]).trim();
        }
    }

    // Si ninguno de los campos existe o tiene contenido,
    // devuelve un texto vacío.
    return "";
}


/*
    ============================================================
    CARGAR UNA HOJA CSV DE GOOGLE SHEETS
    ============================================================

    Recibe la URL de una hoja publicada como CSV.

    Utiliza Papa Parse para descargar y transformar el CSV
    en un arreglo de objetos JavaScript.

    Por ejemplo, una fila de Google Sheets puede convertirse en:
    {
        Equipo: "River Plate",
        Región: "Argentina"
    }

    async permite esperar a que termine la descarga.
*/
async function cargarCSV(url) {

    // Comprueba que se haya proporcionado una URL válida.
    // Si falta, genera un error.
    if (!url || url.startsWith("PEGAR_URL")) {
        throw new Error("Falta configurar una URL CSV de Google Sheets.");
    }

    // Comprueba que Papa Parse esté cargado.
    // typeof permite verificar si una variable o función existe.
    if (typeof Papa === "undefined") {
        throw new Error(
            "Papa Parse no está cargado. Revisá el orden de los scripts."
        );
    }

    // Promise representa una operación que puede completarse
    // correctamente o fallar en algún momento.
    //
    // resolve: indica que la operación terminó correctamente.
    // reject: indica que ocurrió un error.
    return new Promise((resolve, reject) => {

        // Papa.parse descarga y procesa el archivo CSV.
        Papa.parse(url, {

            // Indica que Papa Parse debe descargar el archivo
            // desde la dirección proporcionada.
            download: true,

            // Utiliza la primera fila del CSV como nombres
            // de las propiedades de cada objeto.
            // Ejemplo: la columna "Equipo" se accede como fila.Equipo.
            header: true,

            // Ignora las filas vacías, incluso aquellas que contienen
            // solamente espacios en blanco.
            skipEmptyLines: "greedy",


            // Se ejecuta cuando Papa Parse termina de procesar el CSV.
            complete: function (resultado) {

                // Comprueba si Papa Parse encontró advertencias o errores
                // durante el procesamiento.
                if (resultado.errors && resultado.errors.length > 0) {

                    // Los muestra en la consola del navegador.
                    // warn genera un aviso, pero no detiene el programa.
                    console.warn(
                        "Avisos al leer el CSV:",
                        resultado.errors
                    );
                }

                // Elimina las filas que no contienen ningún dato.
                //
                // Object.values(fila) obtiene todos los valores
                // de las columnas de una fila.
                //
                // some comprueba si al menos uno de esos valores
                // tiene contenido.
                const filas = resultado.data.filter(fila =>
                    Object.values(fila).some(
                        valor => String(valor ?? "").trim() !== ""
                    )
                );

                // Devuelve las filas procesadas.
                // Esto indica que la carga del CSV terminó correctamente.
                resolve(filas);
            },


            // Se ejecuta si ocurre un error durante la descarga
            // o el procesamiento del archivo.
            error: function (error) {

                // Informa que la operación falló.
                reject(error);
            }
        });
    });
}


/*
    ============================================================
    CARGAR TODOS LOS DATOS DEL PROYECTO
    ============================================================

    Esta función reúne la información de las tres hojas de Google Sheets.

    Devuelve un objeto con tres propiedades:
    - equipos
    - competiciones
    - titulos

    Ejemplo de uso:

    const datos = await cargarDatos();

    datos.equipos
    datos.competiciones
    datos.titulos

    Es la función que utilizan listado-equipos.js y torneo.js
    para obtener toda la información del proyecto.
*/
async function cargarDatos() {

    try {

        // Promise.all permite ejecutar varias operaciones al mismo tiempo
        // y esperar hasta que todas terminen.
        //
        // En este caso, descarga simultáneamente las tres hojas.
        //
        // Cuando todas terminan, sus resultados se guardan
        // en el orden indicado:
        // equipos, competiciones y titulos.
        const [equipos, competiciones, titulos] = await Promise.all([

            // Descarga y procesa la hoja de equipos.
            cargarCSV(URLS_PALMARES.equipos),

            // Descarga y procesa la hoja de competiciones.
            cargarCSV(URLS_PALMARES.competiciones),

            // Descarga y procesa la hoja de títulos.
            cargarCSV(URLS_PALMARES.titulos)
        ]);

        // Devuelve un objeto que reúne los tres arreglos obtenidos.
        return {
            equipos,
            competiciones,
            titulos
        };

    } catch (error) {

        // Si alguna de las tres cargas falla, muestra el error
        // en la consola del navegador.
        console.error("Error al cargar los datos del palmarés:", error);

        // Vuelve a lanzar el error para que la función que llamó
        // a cargarDatos también pueda detectarlo.
        throw error;
    }
}


/*
    ============================================================
    COMPROBAR SI UN TÍTULO ESTÁ CONFIRMADO
    ============================================================

    Recibe una fila de la hoja de títulos.

    Su función es determinar si ese título debe contabilizarse
    en los rankings y perfiles de los equipos.

    Busca el estado en distintas columnas posibles:
    - estado
    - confirmado
    - situacion
    - situación

    Si encuentra un estado que indica que el título no está
    confirmado, pendiente o rechazado, devuelve false.

    En cualquier otro caso, devuelve true.
*/
function tituloConfirmado(fila) {

    // Obtiene el estado del título.
    // normalizar permite comparar los valores sin distinguir
    // mayúsculas, minúsculas ni tildes.
    const estado = normalizar(
        obtenerCampo(
            fila,
            "estado",
            "confirmado",
            "situacion",
            "situación"
        )
    );

    // Si no hay ningún estado registrado, considera que el título
    // está confirmado.
    if (!estado) {
        return true;
    }

    // Lista de estados que indican que un título NO debe contabilizarse.
    const estadosNoValidos = [
        "no",
        "no confirmado",
        "no confirmada",
        "pendiente",
        "rechazado",
        "rechazada",
        "falso",
        "false"
    ];

    // includes comprueba si el estado está dentro de la lista.
    //
    // El signo ! invierte el resultado:
    // - Si está en la lista, devuelve false.
    // - Si no está en la lista, devuelve true.
    return !estadosNoValidos.includes(estado);
}


/*
    ============================================================
    CREAR ELEMENTOS HTML
    ============================================================

    Recibe:
    - etiqueta: tipo de elemento HTML que se quiere crear.
    - texto: contenido de texto (opcional).
    - clase: clase CSS que se le quiere asignar (opcional).

    Devuelve el elemento HTML creado.

    Ejemplo:
    crearElemento("p", "Mi texto", "mi-clase")

    Equivale a crear un <p>, introducir "Mi texto"
    y asignarle la clase "mi-clase".
*/
function crearElemento(etiqueta, texto = "", clase = "") {

    // Crea un elemento HTML del tipo indicado.
    // Por ejemplo: "p" crea un párrafo.
    const elemento = document.createElement(etiqueta);

    // Introduce el texto dentro del elemento.
    // textContent coloca texto sin interpretar HTML.
    elemento.textContent = texto;

    // Comprueba si se proporcionó una clase CSS.
    if (clase) {

        // Si existe, se la asigna al elemento.
        elemento.className = clase;
    }

    // Devuelve el elemento terminado para que otra función
    // pueda agregarlo al HTML mediante append(), por ejemplo.
    return elemento;
}
 