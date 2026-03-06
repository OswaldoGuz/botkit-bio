const axios = require("axios");
const logger = console;

async function getForeignLines(opciones = {}) {
  const { numeroLinea, tt } = opciones;

  // Variables de entorno
  const apiUrl = process.env.API_CAMBIO_LINEA_URL || "http://10.152.148.194:3000/api/v1/cambiolinea";
  const apiUsuario = process.env.API_CAMBIO_LINEA_USER;
  const apiPassword = process.env.API_CAMBIO_LINEA_PASSWORD;

  const headers = {
    "Content-Type": "application/json",
    usuario: apiUsuario,
    password: apiPassword,
  };

  const payload = {
    NumeroLinea: numeroLinea,
    TT: tt,
  };

  try {
    logger.info("Iniciando petición POST para getForeignLines...", {numeroLinea, tt,});

    const response = await axios.post(apiUrl, payload, { headers });
    const apiData = response.data;

    logger.info("API getForeignLines ejecutada", {
      status: response.status,
      success: apiData?.success,
    });

    // Extraemos datos sin depender de success true/false
    const accionCode = apiData?.data?.accion || null;

    const botMessage =
      apiData?.data?.mensaje ||
      apiData?.message ||
      "Ocurrió un error inesperado al validar tu registro.";

    return {
      success: apiData?.success ?? false, // respetamos lo que venga del backend
      status: response.status,
      accion: accionCode,
      botMessage: botMessage,
      rawData: apiData?.data || null,
    };
   } catch (error) {
    logger.error("Error técnico al ejecutar getForeignLines", {
      error: error.response?.data || error.message,
      status: error.response?.status,
    });

    return {
      success: false,
      status: error.response?.status || 500,
      accion: null,
      botMessage:
        "Ocurrió un error de conexión al intentar validar tus datos. Por favor, intenta más tarde.",
      error: error.response?.data || error.message,
    };
  }
}

module.exports = { getForeignLines };