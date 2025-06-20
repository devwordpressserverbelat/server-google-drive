import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import DriveController from "../src/controllers/DriveController";
import api from "../src/middleware/apiRouter";

const upload = multer({
  dest: "/tmp/",
});

const apiEscolaPartThree = api;

const uploadFields = upload.fields([
  { name: "declaracao_irpf", maxCount: 1 },
  { name: "previsao_fluxo_caixa", maxCount: 1 },
  { name: "informacoes_mercado", maxCount: 1 },
]);

apiEscolaPartThree.use(uploadFields);

apiEscolaPartThree.post(async (req: any, res) => {
  try {
    const arquivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const dados = req.body;

    if (!dados?.email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }

    const emailFolder = path.join("/tmp", dados.email);
    await fs.ensureDir(emailFolder);

    // Move os arquivos recebidos para a pasta do e-mail
    const arquivosArray: Express.Multer.File[] = [];
    for (const files of Object.values(arquivos)) {
      for (const file of files) {
        const dest = path.join(emailFolder, file.originalname);
        await fs.move(file.path, dest);
        arquivosArray.push({ ...file, path: dest });
      }
    }

    // Se houver assinatura, salva na pasta também
    if (dados.signature && typeof dados.signature === "string") {
      const signatureFile = await Utils.convertBase64(
        dados.signature,
        emailFolder,
        "signature"
      );
      arquivosArray.push(signatureFile);
      delete dados.signature;
    }

    // Verifica se o PDF já existe na pasta
    const pdfPath = path.join(emailFolder, "dadosformulario.pdf");
    const pdfExists = await fs.pathExists(pdfPath);
    if (!pdfExists) {
      return res
        .status(400)
        .json({ error: "O PDF não foi encontrado na pasta do e-mail." });
    }

    // Cria o ZIP contendo o PDF existente + arquivos novos
    const date = Utils.getToDay();
    const zipPath = path.join(emailFolder, `${dados.email}-${date}.zip`);
    await Utils.createZip(pdfPath, arquivosArray, zipPath);

    // Envia o zip ao Google Drive
    const driveLink = await DriveController.uploadToDrive(zipPath);

    // Limpeza: remove arquivos enviados e o ZIP (mas mantém o PDF existente)
    await fs.remove(zipPath);
    for (const file of arquivosArray) {
      await fs.remove(file.path);
    }

    res.status(200).json({ success: true, link: driveLink });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiEscolaPartThree;
