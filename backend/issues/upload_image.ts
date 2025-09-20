import { api, APIError } from "encore.dev/api";
import { issueImages } from "../storage";

export interface UploadImageRequest {
  fileName: string;
  contentType: string;
}

export interface UploadImageResponse {
  uploadUrl: string;
  imageUrl: string;
}

// Generates a signed URL for uploading issue images
export const uploadImage = api<UploadImageRequest, UploadImageResponse>(
  { expose: true, method: "POST", path: "/issues/upload-image" },
  async (req) => {
    const { fileName, contentType } = req;

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw APIError.invalidArgument("Invalid image type. Only JPEG, PNG, and WebP are allowed");
    }

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;

    // Generate signed upload URL
    const { url: uploadUrl } = await issueImages.signedUploadUrl(uniqueFileName, {
      ttl: 3600, // 1 hour
    });

    // Generate public URL for accessing the image
    const imageUrl = issueImages.publicUrl(uniqueFileName);

    return {
      uploadUrl,
      imageUrl,
    };
  }
);
