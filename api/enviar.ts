import { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import nextConnect from "next-connect";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import DriveController from "../src/controllers/DriveController";

// Leitura da variável de ambiente
const allowedOrigin = process.env.CORS_ORIGIN;

const upload = multer({ dest: "/tmp/" });

const apiRoute = nextConnect<VercelRequest, VercelResponse>({
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

apiRoute.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return res.json({ error: "O cors do site não foi configurado" }).end();
  }

  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
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

const uploadFields = upload.fields([
  { name: "curriculum", maxCount: 1 },
  { name: "social_contract", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

apiRoute.use(uploadFields);

apiRoute.post(async (req: any, res) => {
  try {
    const arquivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const dados = req.body;

    if (!dados)
      return res.json({ error: "Não recebemos os dados corretamente" });

    for (const key in dados) {
      if (Object.prototype.hasOwnProperty.call(dados, key)) {
        if (dados[key] === "on") {
          dados[key] = "Sim";
        } else if (dados[key] === undefined || dados[key] === "") {
          dados[key] = "Não";
        }
      }
    }

    const tempFolder = "/tmp";
    await fs.ensureDir(tempFolder);

    const date = Utils.getToDay();

    const pdfPath = path.join(tempFolder, "dadosformulario.pdf");
    const zipPath = path.join(
      tempFolder,
      `${dados?.nome ?? ""}-${dados?.sobrenome ?? ""}-${date}.zip`
    );

    const arquivosArray = Object.values(arquivos).flat();

    if (dados.signature && typeof dados.signature === "string") {
      const signatureFile = await Utils.convertBase64(
        dados.signature,
        tempFolder,
        "signature"
      );
      arquivosArray.push(signatureFile);
      delete dados.signature;
    }

    await Utils.generatePDF(dados, pdfPath);
    await Utils.createZip(pdfPath, arquivosArray, zipPath);

    const driveLink = await DriveController.uploadToDrive(zipPath);

    await fs.remove(pdfPath);
    await fs.remove(zipPath);
    for (const file of arquivosArray) await fs.remove(file.path);

    res.status(200).json({ success: true, link: driveLink });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiRoute;
