import { google, Auth } from "googleapis";
import readline from "readline/promises";
import dotenv from "dotenv";

import api from "../src/middleware/apiRouter";

const authDrive = api;
dotenv.config();

authDrive.post(async (req: any, res) => {
  // getRefreshToken.ts

  // As credenciais do seu cliente OAuth 2.0
  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
  };

  // Define os escopos de permissão necessários.
  const SCOPES: string[] = ["https://www.googleapis.com/auth/drive"];

  // Cria uma instância do cliente OAuth2 com tipagem
  const oauth2Client: Auth.OAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uri
  );

  // Gera a URL de autorização.
  // 'access_type: offline' é essencial para obter um refresh token.
  // 'prompt: consent' força a tela de consentimento para garantir a emissão de um refresh token.
  const authUrl: string = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("1. Abra esta URL no seu navegador e autorize o aplicativo:");
  console.log(authUrl);
  console.log("\n---------------------------------\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return res.json(authUrl);
});

export default authDrive;
