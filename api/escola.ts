import multer from "multer";
import fs from "fs-extra";
import path from "path";
import Utils from "../src/utils/utils";
import api from "../src/middleware/apiRouter";

const upload = multer({ dest: "/tmp/" });

const apiEscola = api;

const uploadFields = upload.fields([{ name: "balanco_dre", maxCount: 3 }]);

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

    const emailFolder = path.join("/tmp", dados.email || "sem-email");
    await fs.ensureDir(emailFolder);

    // Salvar arquivos recebidos na pasta do e-mail
    const arquivosArray = Object.values(arquivos).flat();
    for (const file of arquivosArray) {
      const destPath = path.join(emailFolder, file.originalname);
      await fs.move(file.path, destPath, { overwrite: true });
    }
    // Gerar PDF e salvar na pasta do e-mail
    const pdfPath = path.join(emailFolder, "dadosformulario.pdf");
    await Utils.generatePDF(dados, pdfPath);

    res
      .status(200)
      .json({ success: true, message: "parte 1 recebida com sucesso" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao processar dados." });
  }
});

export default apiEscola;
