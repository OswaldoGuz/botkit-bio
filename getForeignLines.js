const axios = require("axios");
const logger = require("./lib/logger");

async function getForeignLines(opciones = {}) {
  const { 
    numeroLinea, 
    tt 
  } = opciones;

  const apiUrl = process.env.API_CAMBIO_LINEA_URL || "http://10.152.148.194:3000/api/v1/cambiolinea";
  const apiUsuario = process.env.API_CAMBIO_LINEA_USER;
  const apiPassword = process.env.API_CAMBIO_LINEA_PASSWORD;

  const headers = {
    "Content-Type": "application/json",
    "usuario": apiUsuario,
    "password": apiPassword
  };

  const payload = {
    "NumeroLinea": numeroLinea,
    "TT": tt
  };

  try {
    logger.info("Iniciando petición POST para getForeignLines...", { numeroLinea, tt });

    const response = await axios.post(apiUrl, payload, { headers });
    const apiData = response.data; 

    logger.info("API getForeignLines ejecutada exitosamente", { status: response.status });

    // Evaluación de la respuesta
    let botMessage = "Ocurrió un error inesperado al validar tu registro."; 
    let accionCode = null;

    if (apiData.success && apiData.data && apiData.data.accion) {
      accionCode = apiData.data.accion;
      
      switch (accionCode) {
        case 1:
          botMessage = "¡Validación exitosa! El registro se encuentra activo.";
          break;
        case 2:
          botMessage = "Lo sentimos, no pudimos completar la validación, no pasó la validación del registro biométrico. Por favor, intenta de nuevo.";
          break;
        case 3:
          botMessage = "Lo sentimos, no hemos encontrado datos de tu registro biométrico en el sistema. Por favor, intenta de nuevo.";
          break;
        default:
          botMessage = apiData.message || "Respuesta de validación no reconocida.";
      }
    }

    return { 
      success: true, 
      status: response.status,
      accion: accionCode,
      botMessage: botMessage,
      rawData: apiData.data 
    };

  } catch (error) {
    logger.error("Error al ejecutar la API getForeignLines", { 
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    return { 
      success: false, 
      status: error.response?.status || 500,
      botMessage: "Ocurrió un error de conexión al intentar validar tus datos. Por favor, intenta más tarde.",
      error: error.response?.data || error.message 
    };
  }
}

module.exports = { getForeignLines };