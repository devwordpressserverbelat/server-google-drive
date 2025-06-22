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
      res.status(400).json({ error: "E-mail é obrigatório" });
      return;
    }

    const emailFolder = path.join("/tmp", dados.email);
    await fs.ensureDir(emailFolder);

    // Move arquivos recebidos nesta etapa
    const arquivosArray = Object.values(arquivos).flat();
    for (const file of arquivosArray) {
      const destPath = path.join(
        emailFolder,
        Utils.formatNameFile(file.fieldname, file.originalname)
      );
      await fs.move(file.path, destPath, { overwrite: true });
    }

    // ✅ Lista todos os arquivos da pasta
    const arquivosNaPasta = await fs.readdir(emailFolder);
    const arquivosParaZip = arquivosNaPasta.map((nome) => ({
      originalname: nome,
      path: path.join(emailFolder, nome),
    }));

    // Cria o ZIP
    const date = Utils.getToDay();
    const zipPath = path.join(emailFolder, `${dados.email}-${date}.zip`);

    await Utils.createZipDoc(arquivosParaZip, zipPath);

    // Envia para o Drive
    const driveLink = await DriveController.uploadToDrive(zipPath);
    console.log("asd");
    // Limpeza
    await fs.remove(emailFolder);
    await fs.remove(zipPath);

    res.status(200).json({ success: true, link: driveLink });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiEscolaPartThree;
