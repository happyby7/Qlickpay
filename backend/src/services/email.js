const axios = require("axios");

const sendVerificationEmail = async (email) => {
    try {
        console.log("📤 Enviando email a:", email);
        const response = await axios.post("https://api.brevo.com/v3/smtp/email", {
            sender: { email: "no-reply@qlickpay.com", name: "QlickPay" },
            to: [{ email }],
            subject: "Verificación de Cuenta - QlickPay",
            htmlContent: "<p>¡Bienvenido a <strong>QlickPay</strong>! Haz clic en el siguiente enlace para verificar tu cuenta.</p>"
        }, {
            headers: {
                "accept": "application/json",
                "api-key": "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",
                "content-type": "application/json"
            }
        });

        console.log("✅ Email enviado con éxito a:", email, response.data);
    } catch (error) {
        console.error("❌ Error al enviar email:", error.response ? error.response.data : error);
    }
};

module.exports = { sendVerificationEmail };
