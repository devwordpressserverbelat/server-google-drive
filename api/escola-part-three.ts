import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import api from "../src/middleware/apiRouter";
import DriveController from "../src/controllers/DriveController";

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
    const arquivosObj = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const arquivos: Express.Multer.File[] = Object.values(arquivosObj).flat();

    const dados = req.body;

    if (!dados?.email) {
      res.status(400).json({ error: "E-mail é obrigatório" });
      return;
    }

    const folderName = `${dados.email}-Geral`;
    let folderId: string | null;

    folderId = await DriveController.findFolderIdByName(folderName);

    if (!folderId) folderId = await DriveController.createFolder(folderName);

    const emailFolder = path.join("/tmp", dados.email);
    await fs.ensureDir(emailFolder);

    const arquivosArray = Object.values(arquivos).flat();
    for (const file of arquivosArray) {
      const destPath = path.join(
        emailFolder,
        Utils.formatNameFile(file.fieldname, file.originalname)
      );
      await fs.move(file.path, destPath, { overwrite: true });

      await DriveController.uploadToFolder(destPath, folderId);
    }

    await fs.remove(emailFolder);

    res.status(200).json({
      success: true,
      step: "2/3 concluído",
      folderId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no Step 2" });
  }
});

export default apiEscolaPartThree;
