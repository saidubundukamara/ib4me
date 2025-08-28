import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  folder?: string;
  created_at: string;
  bytes: number;
}

export interface CloudinaryDeleteResult {
  deleted: Record<string, string>;
  partial: boolean;
}

export interface CloudinaryResourcesResult {
  resources: CloudinaryUploadResult[];
  next_cursor?: string;
  total_count: number;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: Record<string, string | number | boolean | undefined>;
  resource_type?: "image" | "video" | "raw" | "auto";
  overwrite?: boolean;
  unique_filename?: boolean;
}

export interface ListOptions {
  type?: "upload" | "private" | "authenticated";
  prefix?: string;
  max_results?: number;
  next_cursor?: string;
  resource_type?: "image" | "video" | "raw";
}

export class CloudinaryService {
  static async uploadFile(
    file: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: options.resource_type || "auto",
        folder: options.folder || "ecommerce",
        unique_filename: options.unique_filename ?? true,
        overwrite: options.overwrite ?? false,
        transformation: options.transformation,
        public_id: options.public_id,
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        folder: result.folder,
        created_at: result.created_at,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload file to Cloudinary");
    }
  }

  static async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: options.resource_type || "auto",
          folder: options.folder || "ecommerce",
          unique_filename: options.unique_filename ?? true,
          overwrite: options.overwrite ?? false,
          transformation: options.transformation,
          public_id: options.public_id,
        },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload_stream error:", error);
            reject(new Error("Failed to upload file to Cloudinary"));
            return;
          }
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: (result as unknown as { width?: number }).width ?? 0,
            height: (result as unknown as { height?: number }).height ?? 0,
            format: (result as unknown as { format?: string }).format ?? "",
            resource_type: result.resource_type,
            folder: (result as unknown as { folder?: string }).folder,
            created_at: result.created_at,
            bytes: (result as unknown as { bytes?: number }).bytes ?? 0,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete file from Cloudinary");
    }
  }

  static async deleteFiles(
    publicIds: string[]
  ): Promise<CloudinaryDeleteResult> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return {
        deleted: result.deleted,
        partial: result.partial || false,
      };
    } catch (error) {
      console.error("Cloudinary bulk delete error:", error);
      throw new Error("Failed to delete files from Cloudinary");
    }
  }

  static async listFiles(
    options: ListOptions = {}
  ): Promise<CloudinaryResourcesResult> {
    try {
      const result = await cloudinary.api.resources({
        type: options.type || "upload",
        prefix: options.prefix,
        max_results: options.max_results || 50,
        next_cursor: options.next_cursor,
        resource_type: options.resource_type || "image",
      });

      return {
        resources: result.resources.map(
          (resource: {
            public_id: string;
            secure_url: string;
            width?: number;
            height?: number;
            format?: string;
            resource_type: string;
            folder?: string;
            created_at: string;
            bytes?: number;
          }) => ({
            public_id: resource.public_id,
            secure_url: resource.secure_url,
            width: resource.width ?? 0,
            height: resource.height ?? 0,
            format: resource.format ?? "",
            resource_type: resource.resource_type,
            folder: resource.folder,
            created_at: resource.created_at,
            bytes: resource.bytes ?? 0,
          })
        ),
        next_cursor: result.next_cursor,
        total_count: result.total_count,
      };
    } catch (error) {
      console.error("Cloudinary list error:", error);
      throw new Error("Failed to list files from Cloudinary");
    }
  }

  static async listFolders(prefix?: string): Promise<string[]> {
    try {
      const result = await cloudinary.api.sub_folders(prefix || "");
      return result.folders.map((folder: { name: string }) => folder.name);
    } catch (error) {
      console.error("Cloudinary list folders error:", error);
      throw new Error("Failed to list folders from Cloudinary");
    }
  }

  static async deleteFolder(folder: string): Promise<boolean> {
    try {
      await cloudinary.api.delete_folder(folder);
      return true;
    } catch (error) {
      console.error("Cloudinary delete folder error:", error);
      throw new Error("Failed to delete folder from Cloudinary");
    }
  }

  static async createFolder(path: string): Promise<boolean> {
    try {
      await cloudinary.api.create_folder(path);
      return true;
    } catch (error) {
      console.error("Cloudinary create folder error:", error);
      throw new Error("Failed to create folder in Cloudinary");
    }
  }

  static generateTransformationUrl(
    publicId: string,
    transformations: Record<string, string | number | boolean | undefined>
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
  }
}

export default CloudinaryService;
