import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import DriveController from "../src/controllers/DriveController";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const uploadFields = upload.fields([
  { name: "curriculum", maxCount: 1 },
  { name: "social_contract", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

app.post("/server", uploadFields, async (req, res) => {
  try {
    const arquivos = req.files;
    const dados = req.body;

    if (!dados) {
      res.json({ error: "Não recebemos os dados corretamente" });
    }

    for (const key in dados) {
      if (Object.prototype.hasOwnProperty.call(dados, key)) {
        if (dados[key] === "on") {
          dados[key] = "Sim";
        } else if (dados[key] === undefined || dados[key] === "") {
          dados[key] = "Não";
        }
      }
    }

    console.log("Arquivos recebidos:", arquivos);
    console.log("Dados do formulário:", dados);

    const tempFolder = "temp";
    await fs.ensureDir(tempFolder);

    const date = Utils.getToDay();

    const pdfPath = path.join(tempFolder, "dadosformulario.pdf");
    const zipPath = path.join(
      tempFolder,
      `${dados?.nome ? dados.nome : ""}-${
        dados?.sobrenome ? dados.sobrenome : ""
      }-${date}.zip`
    );

    if (!arquivos) {
      res.status(400).json({ error: "Nenhum arquivo foi enviado." });
      return;
    }
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

    await fs.remove(tempFolder);
    for (const file of arquivosArray) await fs.remove(file.path);
    res.json({ success: true, link: driveLink });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

// Exportando o app Express como uma função serverless
export default app;
