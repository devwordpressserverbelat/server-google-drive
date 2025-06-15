// import express from "express";
// import multer from "multer";
// import cors from "cors";
// import fs from "fs-extra";
// import path from "path";
// import Utils from "./utils/utils";
// import DriveController from "./controllers/DriveController";

// const app = express();
// app.use(cors());

// const upload = multer({ dest: "uploads/" });

// const uploadFields = upload.fields([
//   { name: "curriculum", maxCount: 1 },
//   { name: "social_contract", maxCount: 1 },
//   { name: "signature", maxCount: 1 },
// ]);

// app.post("/enviar", uploadFields, async (req, res): Promise<any> => {
//   try {
//     const arquivos = req.files as {
//       [fieldname: string]: Express.Multer.File[];
//     };

//     const dados = req.body;

//     if (!dados) {
//       res.json({ error: "Não recebemos os dados corretamente" });
//     }

//     for (const key in dados) {
//       if (Object.prototype.hasOwnProperty.call(dados, key)) {
//         if (dados[key] === "on") {
//           dados[key] = "Sim";
//         } else if (dados[key] === undefined || dados[key] === "") {
//           dados[key] = "Não";
//         }
//       }
//     }

//     console.log("Arquivos recebidos:", arquivos);
//     console.log("Dados do formulário:", dados);

//     const tempFolder = "temp";
//     await fs.ensureDir(tempFolder);

//     const date = Utils.getToDay();

//     const pdfPath = path.join(tempFolder, "dadosformulario.pdf");
//     const zipPath = path.join(
//       tempFolder,
//       `${dados?.nome ? dados.nome : ""}-${
//         dados?.sobrenome ? dados.sobrenome : ""
//       }-${date}.zip`
//     );

//     const arquivosArray = Object.values(arquivos).flat();

//     if (dados.signature && typeof dados.signature === "string") {
//       const signatureFile = await Utils.convertBase64(
//         dados.signature,
//         tempFolder,
//         "signature"
//       );
//       arquivosArray.push(signatureFile);
//       delete dados.signature;
//     }

//     await Utils.generatePDF(dados, pdfPath);
//     await Utils.createZip(pdfPath, arquivosArray, zipPath);

//     const driveLink = await DriveController.uploadToDrive(zipPath);

//     await fs.remove(tempFolder);
//     for (const file of arquivosArray) await fs.remove(file.path);
//     res.send();
//     res.json({ success: true, link: driveLink });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ success: false, message: "Erro ao processar dados." });
//   }
// });

// app.listen(3000, () => console.log("Servidor rodando na porta 3000..."));
