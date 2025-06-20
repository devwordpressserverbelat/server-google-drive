import nextConnect from "next-connect";
import { VercelRequest, VercelResponse } from "@vercel/node";

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

api.use((req, res, next) => {
  const origin = req.headers.origin;

  //   if (!origin) {
  //     return res.json({ error: "O cors do site não foi configurado" }).end();
  //   }

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    // Se a origem é válida, continua para a rota
    return next();
  }

  // Importante: não envie resposta ao OPTIONS antes da verificação da origem
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

export default api;
