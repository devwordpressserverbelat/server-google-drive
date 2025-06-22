import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import api from "../src/middleware/apiRouter";

const upload = multer({ dest: "/tmp/" });

const apiEscolaPartOne = api;

const uploadFields = upload.fields([{ name: "balanco_dre", maxCount: 3 }]);

apiEscolaPartOne.use(uploadFields);

apiEscolaPartOne.post(async (req: any, res) => {
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
      await fs.move(file.path, destPath, { dereference: true });
    }

    const pdfPath = path.join(emailFolder, "dadosformulario.pdf");
    await Utils.generatePDF(dados, pdfPath);

    // LOG

    const tmpPath = "/tmp";

    const files = await fs.readdir(tmpPath);

    console.log("📁 Conteúdo da pasta /tmp:");

    for (const file of files) {
      const filePath = path.join(tmpPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        const innerFiles = await fs.readdir(filePath);
        console.log(`📂 Pasta: ${file}`);
        innerFiles.forEach((f) => {
          console.log(`   └── ${f}`);
        });
      } else {
        console.log(`📄 Arquivo: ${file}`);
      }
    }

    // LOG

    res
      .status(200)
      .json({ success: true, message: "Parte 1 recebida com sucesso" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiEscolaPartOne;
