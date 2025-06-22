import multer from "multer";
import fs from "fs-extra";
import path from "path";
import api from "../src/middleware/apiRouter";
import Utils from "../src/utils/utils";

const upload = multer({
  dest: "/tmp/",
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "balance_ano_corrente", maxCount: 1 },
  { name: "relacao_mensal_faturamento_three_anos", maxCount: 1 },
  { name: "valor_mensal_vendas_tres_anos", maxCount: 1 },
]);

const handler = api;
handler.use(uploadFields);

handler.post(async (req: any, res) => {
  try {
    const arquivos = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const dados = req.body;

    if (!dados?.email) {
      res.status(400).json({ error: "E-mail obrigatório" });
      return;
    }

    const emailFolder = path.join("/tmp", dados.email);
    await fs.ensureDir(emailFolder);

    const arquivosArray = Object.values(arquivos).flat();
    for (const file of arquivosArray) {
      const destPath = path.join(
        emailFolder,
        Utils.formatNameFile(file.fieldname, file.originalname)
      );
      await fs.move(file.path, destPath, { overwrite: true });
    }

    res.status(200).json({ success: true, step: "2/3 concluído" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no Step 2" });
  }
});

export default handler;
