import fs from "fs-extra";
import path from "path";
import driveApi from "../api/drive";

export default class DriveController {
  static async uploadToDrive(filePath: string): Promise<string> {
    const fileMetadata = {
      name: path.basename(filePath),
    };

    const media = {
      mimeType: "application/zip",
      body: fs.createReadStream(filePath),
    };

    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    return (
      response.data.webViewLink ||
      "Upload realizado, mas sem link de visualização."
    );
  }

  // ✅ Novo método para upload em uma pasta específica
  static async uploadToFolder(
    filePath: string,
    folderId: string
  ): Promise<string> {
    const fileMetadata = {
      name: path.basename(filePath),
      parents: [folderId], // Define a pasta no Drive
    };

    const media = {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(filePath),
    };

    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    return (
      response.data.webViewLink ||
      "Upload realizado, mas sem link de visualização."
    );
  }

  // ✅ Método para criar uma pasta
  static async createFolder(folderName: string): Promise<string> {
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    return response.data.id!;
  }

  static async findFolderIdByName(folderName: string): Promise<string | null> {
    const res = await driveApi.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const folder = res.data.files?.[0];
    return folder ? folder.id! : null;
  }
}
