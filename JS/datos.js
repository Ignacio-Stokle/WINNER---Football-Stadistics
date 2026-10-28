
const URLS_PALMARES = {
    equipos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=1209858657&single=true&output=csv",
    competiciones: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=359945927&single=true&output=csv",
    titulos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6kWG9GH-wEc5pi80HOypcaqXwCxUwh34Dv9mB5QnuZcrVdsr1sz_eDzBMCJssT8aFF95uWpcCFj2/pub?gid=101958128&single=true&output=csv"
};

/**
 * Normaliza un texto para comparar nombres sin distinguir
 * mayúsculas, minúsculas ni tildes.
 */
function normalizar(valor) {
    return String(valor ?? "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Devuelve el primer campo existente y no vacío de una fila.
 * Permite probar diferentes nombres de columna.
 */
function obtenerCampo(fila, ...nombres) {
    for (const nombre of nombres) {
        if (
            fila &&
            fila[nombre] !== undefined &&
            fila[nombre] !== null &&
            String(fila[nombre]).trim() !== ""
        ) {
            return String(fila[nombre]).trim();
        }
    }

    return "";
}

/**
 * Carga una hoja CSV publicada de Google Sheets.
 * Requiere que Papa Parse esté cargado antes que este archivo.
 */
async function cargarCSV(url) {
    if (!url || url.startsWith("PEGAR_URL")) {
        throw new Error("Falta configurar una URL CSV de Google Sheets.");
    }

    if (typeof Papa === "undefined") {
        throw new Error(
            "Papa Parse no está cargado. Revisá el orden de los scripts."
        );
    }

    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: "greedy",

            complete: function (resultado) {
                if (resultado.errors && resultado.errors.length > 0) {
                    console.warn(
                        "Avisos al leer el CSV:",
                        resultado.errors
                    );
                }

                const filas = resultado.data.filter(fila =>
                    Object.values(fila).some(
                        valor => String(valor ?? "").trim() !== ""
                    )
                );

                resolve(filas);
            },

            error: function (error) {
                reject(error);
            }
        });
    });
}

/**
 * Carga las tres hojas y devuelve sus datos.
 *
 * Uso:
 * const datos = await cargarDatos();
 * console.log(datos.equipos);
 * console.log(datos.competiciones);
 * console.log(datos.titulos);
 */
async function cargarDatos() {
    try {
        const [equipos, competiciones, titulos] = await Promise.all([
            cargarCSV(URLS_PALMARES.equipos),
            cargarCSV(URLS_PALMARES.competiciones),
            cargarCSV(URLS_PALMARES.titulos)
        ]);

        return {
            equipos,
            competiciones,
            titulos
        };
    } catch (error) {
        console.error("Error al cargar los datos del palmarés:", error);
        throw error;
    }
}

/**
 * Indica si un título debe contabilizarse.
 * Excluye los registros cuyo estado sea una variante de
 * "no confirmado", "pendiente" o "no".
 *
 * Si tu hoja usa otros valores para indicar el estado,
 * habrá que adaptar esta función a tus columnas reales.
 */
function tituloConfirmado(fila) {
    const estado = normalizar(
        obtenerCampo(
            fila,
            "estado",
            "confirmado",
            "situacion",
            "situación"
        )
    );

    if (!estado) {
        return true;
    }

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

    return !estadosNoValidos.includes(estado);
}

/**
 * Crea un elemento HTML y le asigna texto de forma segura.
 * Uso: crearElemento("p", "Mi texto", "mi-clase")
 */
function crearElemento(etiqueta, texto = "", clase = "") {
    const elemento = document.createElement(etiqueta);

    elemento.textContent = texto;

    if (clase) {
        elemento.className = clase;
    }

    return elemento;
}
