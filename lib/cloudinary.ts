import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

export async function uploadPackageImageToCloudinary(input: {
  buffer: Buffer;
  mimeType: string;
  filenameHint: string;
}): Promise<{ url: string }> {
  const cfg = getCloudinaryConfig();
  if (!cfg) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  });

  const dataUri = `data:${input.mimeType};base64,${input.buffer.toString("base64")}`;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: "tour-agency/packages",
    resource_type: "image",
    public_id: input.filenameHint.replace(/\.[a-z0-9]+$/i, ""),
    overwrite: false,
  });

  return { url: res.secure_url || res.url };
}

