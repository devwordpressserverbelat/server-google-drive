import PDFDocument from "pdfkit";

import fs from "fs-extra";
import archiver from "archiver";
import path from "path";

export default class Utils {
  static generatePDF(
    data: Record<string, string>,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      doc
        .fontSize(24)
        .text("Dados recebidos do formulário", { underline: true });

      doc.moveDown();

      Object.entries(data).forEach(([key, value]) => {
        let keyFormat = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        doc.fontSize(12).text(`${keyFormat} : ${value}`);
      });

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  static async createZip(
    pdfPath: string,
    files: Express.Multer.File[],
    zipPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);

      archive.file(pdfPath, { name: "dadosformulario.pdf" });

      files.forEach((file) => {
        archive.file(file.path, { name: file.originalname });
      });

      archive.finalize();

      output.on("close", resolve);
      archive.on("error", reject);
    });
  }

  static async createZipDoc(
    files: { path: string; originalname: string }[],
    zipPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", resolve);
      archive.on("error", reject);

      archive.pipe(output);

      files.forEach((file) => {
        archive.file(file.path, { name: file.originalname });
      });

      archive.finalize();
    });
  }

  static async convertBase64(
    base64: string,
    destFolder: string,
    fileNameWithoutExt: string = "file"
  ): Promise<Express.Multer.File> {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Formato base64 inválido.");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType.split("/")[1];
    const fileName = `${fileNameWithoutExt}.${extension}`;
    const filePath = path.join(destFolder, fileName);
    const buffer = Buffer.from(base64Data, "base64");

    await fs.ensureDir(destFolder);
    await fs.writeFile(filePath, buffer);

    return {
      fieldname: fileNameWithoutExt,
      originalname: fileName,
      encoding: "7bit",
      mimetype: mimeType,
      destination: destFolder,
      filename: fileName,
      path: filePath,
      size: buffer.length,
      stream: fs.createReadStream(filePath),
      buffer,
    } as Express.Multer.File;
  }

  static getToDay() {
    const dataAtual = new Date();
    const dataFormatada = `${String(dataAtual.getDate()).padStart(
      2,
      "0"
    )}-${String(dataAtual.getMonth() + 1).padStart(
      2,
      "0"
    )}-${dataAtual.getFullYear()}`;

    return dataFormatada;
  }
}
