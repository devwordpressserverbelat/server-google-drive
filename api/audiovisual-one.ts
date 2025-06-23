import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import api from "../src/middleware/apiRouter";
import DriveController from "../src/controllers/DriveController";

const upload = multer({ dest: "/tmp/" });

const apiSchool = api;

const uploadFields = upload.fields([
  { name: "balanco_dre", maxCount: 1 },
  { name: "balance_ano_corrente", maxCount: 1 },
]);

apiSchool.use(uploadFields);

apiSchool.post(async (req: any, res) => {
  try {
    const arquivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const dados = req.body;

    if (!dados?.email) {
      res.status(400).json({ error: "E-mail obrigatório" });
      return;
    }

    const folderName = `${dados.email}-audiovisual`;

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
      await fs.move(file.path, destPath, { dereference: true });

      await DriveController.uploadToFolder(destPath, folderId);
    }

    const pdfPath = path.join(emailFolder, "dadosformulario.pdf");
    await Utils.generatePDF(dados, pdfPath);
    await DriveController.uploadToFolder(pdfPath, folderId);

    await fs.remove(emailFolder);

    res.status(200).json({
      success: true,
      message: "Parte 1 recebida com sucesso",
      folderId,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiSchool;
