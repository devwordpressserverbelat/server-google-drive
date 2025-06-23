// src/routes/authDrive.ts

import { google, Auth } from "googleapis";
import dotenv from "dotenv";
import api from "../src/middleware/apiRouter";

// Carrega o .env
dotenv.config();

const authDrive = api;

authDrive.post(async (req: any, res) => {
  const { code } = req.body;

  if (!code) {
    return res
      .status(400)
      .json({ error: "Código de autorização não fornecido." });
  }

  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
  };

  if (
    !credentials.client_id ||
    !credentials.client_secret ||
    !credentials.redirect_uri
  ) {
    return res.status(500).json({
      error: "Variáveis de ambiente não estão definidas corretamente.",
    });
  }

  const SCOPES: string[] = ["https://www.googleapis.com/auth/drive"];

  const oauth2Client: Auth.OAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uri
  );

  try {
    const { tokens }: { tokens: Auth.Credentials } =
      await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(200).json({
        warning:
          "Nenhum Refresh Token retornado. Revogue o acesso e tente novamente.",
        tokens,
      });
    }

    return res.status(200).json({
      message: "Tokens obtidos com sucesso.",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Erro ao obter os tokens.",
      details: err.response?.data || err.message,
    });
  }
});

export default authDrive;
