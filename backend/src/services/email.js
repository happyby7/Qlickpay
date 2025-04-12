const axios = require("axios");
require('dotenv').config();

const sendVerificationEmail = async (email) => {
  try {
    const response = await axios.post(
      process.env.BREVO_API_URL, 
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: "QlickPay"
        },
        to: [{ email }],
        subject: "Verificación de Cuenta - QlickPay",
        htmlContent:
          "<p>¡Bienvenido a <strong>QlickPay</strong>! Haz clic en el siguiente enlace para verificar tu cuenta.</p>"
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json"
        }
      }
    );

    console.log("✅ Email enviado con éxito a:", email, response.data);
  } catch (error) {
    const errorMsg = error.response?.data || error.message || error;
    console.error("❌ Error al enviar email:", errorMsg);
  }
};

module.exports = { sendVerificationEmail };
