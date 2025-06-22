import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import DriveController from "../src/controllers/DriveController";
import api from "../src/middleware/apiRouter";

const upload = multer({ dest: "/tmp/" });

const uploadFields = upload.fields([
  { name: "curriculum", maxCount: 1 },
  { name: "social_contract", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

const apiEnviar = api;

apiEnviar.use(uploadFields);

apiEnviar.post(async (req: any, res) => {
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

    const emailFolder = path.join("/tmp", dados.email);
    await fs.ensureDir(emailFolder);

    const pdfPath = path.join(emailFolder, "dadosformulario.pdf");

    const arquivosArray = Object.values(arquivos).flat();

    if (dados.signature && typeof dados.signature === "string") {
      const signatureFile = await Utils.convertBase64(
        dados.signature,
        emailFolder,
        "signature"
      );
      arquivosArray.push(signatureFile);
      delete dados.signature;
    }

    await Utils.generatePDF(dados, pdfPath);

    const folderName = `${dados.email}`;

    let folderId: string | null;

    folderId = await DriveController.findFolderIdByName(folderName);

    if (!folderId) folderId = await DriveController.createFolder(folderName);

    for (const file of arquivosArray) {
      const destPath = path.join(
        emailFolder,
        Utils.formatNameFile(file.fieldname, file.originalname)
      );
      await fs.move(file.path, destPath, { overwrite: true });

      await DriveController.uploadToFolder(destPath, folderId);
    }

    await fs.remove(pdfPath);
    for (const file of arquivosArray) await fs.remove(file.path);

    res.status(200).json({ success: true, folderId: folderId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiEnviar;
