import nextConnect from "next-connect";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { json } from "body-parser";

// ⚙️ Desativar o bodyParser padrão do Next.js e definir limite
export const config = {
  api: {
    bodyParser: false, // Desativa o parser padrão
  },
};

const allowedOrigin = process.env.CORS_ORIGIN;

const api = nextConnect<VercelRequest, VercelResponse>({
  onError(error, req, res) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  },
  onNoMatch(req, res) {
    res.status(405).json({ success: false, message: "Método não permitido." });
  },
});

// 🧠 Usa body-parser com limite maior (10mb)
api.use(json({ limit: "20mb" }));

// 🌐 Middleware CORS
api.use((req, res, next) => {
  const origin = req.headers.origin;

  // Permitir todos os CORS (ou limitar com allowedOrigin, se quiser)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

export default api;
