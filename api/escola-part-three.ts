import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import DriveController from "../src/controllers/DriveController";
import api from "../src/middleware/apiRouter";

const upload = multer({
  dest: "/tmp/",
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB por arquivo
  },
});

const apiEscola = api;

const uploadFields = upload.fields([
  { name: "declaracao_irpf", maxCount: 1 },
  { name: "previsao_fluxo_caixa", maxCount: 1 },
  { name: "informacoes_mercado", maxCount: 1 },
]);

apiEscola.use(uploadFields);

apiEscola.post(async (req: any, res) => {
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
    const zipPath = path.join(tempFolder, `${dados?.email ?? ""}-${date}.zip`);

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

export default apiEscola;
