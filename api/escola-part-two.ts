import multer from "multer";
import fs from "fs-extra";
import path from "path";
import api from "../src/middleware/apiRouter";

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
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "E-mail obrigatório" });

    const tempFolder = `/tmp/${email}`;
    await fs.ensureDir(tempFolder);

    // Salvar somente os arquivos na pasta do e-mail
    for (const files of Object.values(arquivos)) {
      for (const file of files) {
        const dest = path.join(tempFolder, file.originalname);
        await fs.copy(file.path, dest);
        await fs.remove(file.path);
      }
    }

    return res.status(200).json({ success: true, step: "2/3 concluído" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no Step 2" });
  }
});

export default handler;
