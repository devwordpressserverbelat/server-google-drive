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

  const code = await rl.question(
    '2. Cole aqui o "code" da URL de redirecionamento e pressione ENTER: '
  );
  rl.close();

  try {
    // Troca o código de autorização pelos tokens.
    // A resposta é tipada para garantir que 'tokens' contenha as credenciais.
    const { tokens }: { tokens: Auth.Credentials } =
      await oauth2Client.getToken(code);

    console.log("\n---------------------------------\n");
    console.log("SUCESSO! Seus tokens são:");

    if (tokens.refresh_token) {
      console.log("!!!!!! GUARDE ESTE REFRESH TOKEN COM SEGURANÇA !!!!!!");
      console.log("Refresh Token:", tokens.refresh_token);
      console.log("\nAgora, copie o Refresh Token e cole no seu arquivo .env");
    } else {
      console.warn(
        "ATENÇÃO: Nenhum Refresh Token foi retornado. Se precisar de um, revogue o acesso do app na sua conta Google e tente novamente."
      );
    }

    console.log("Access Token:", tokens.access_token);
    console.log("\n---------------------------------\n");
  } catch (err: any) {
    console.error(
      "Erro ao obter os tokens:",
      err.response?.data || err.message
    );
  }
});

export default authDrive;
