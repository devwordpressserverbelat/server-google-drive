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
}
