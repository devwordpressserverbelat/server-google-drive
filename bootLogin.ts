import dotenv from "dotenv";
import { google } from "googleapis";
import readline from "readline";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// URL de autorização com escopo de acesso ao Google Drive
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // necessário para obter o refresh_token
  scope: ["https://www.googleapis.com/auth/drive.file"], // ou "drive" para acesso total
});

console.log("\n1️⃣ Acesse esta URL no navegador e autorize o app:");
console.log(authUrl);

// Após autorizar, você receberá um código via redirect URI.
// Cole o código no terminal quando solicitado.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\n2️⃣ Cole o código que recebeu na URL aqui: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n✅ Seu REFRESH TOKEN é:");
    console.log(tokens.refresh_token);
    rl.close();
  } catch (err) {
    console.error("❌ Erro ao trocar código por token:", err);
    rl.close();
  }
});
