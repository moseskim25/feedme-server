import Cloudflare from "cloudflare";
import { toFile } from "cloudflare/uploads";

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const preferredVariant = process.env.CLOUDFLARE_IMAGES_DELIVERY_VARIANT;

if (!apiToken) {
  throw new Error("CLOUDFLARE_API_TOKEN is not set");
}

if (!accountId) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
}

const client = new Cloudflare({
  apiToken,
});

export type CloudflareImageUploadResult = {
  id: string;
  variants: string[];
  deliveryUrl?: string;
};

const sanitizeImageId = (fileName?: string) => {
  if (!fileName) {
    return undefined;
  }

  const base = fileName.replace(/\.[^.]+$/, "");
  const slug = base
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  if (!slug) {
    return undefined;
  }

  return `${slug}-${Date.now()}`;
};

const findVariantUrl = (variants: string[]) => {
  if (!variants.length) {
    return undefined;
  }

  if (preferredVariant) {
    const match = variants.find((variant) =>
      variant.endsWith(`/${preferredVariant}`)
    );
    if (match) {
      return match;
    }
  }

  return variants[0];
};

export const uploadToCloudflareImages = async (
  buffer: Buffer,
  fileName?: string
): Promise<CloudflareImageUploadResult> => {
  const sanitizedId = sanitizeImageId(fileName);
  const uploadFileName = `${sanitizedId ?? `generated-${Date.now()}`}.png`;
  const file = await toFile(buffer, uploadFileName, { type: "image/png" });


  
  const response = await client.images.v1.create({
    account_id: accountId,
    file,
    ...(sanitizedId ? { id: sanitizedId } : {}),
  });



  if (!response?.id) {
    throw new Error("Failed to upload image to Cloudflare Images");
  }

  const variants = response.variants ?? [];

  return {
    id: response.id,
    variants,
    deliveryUrl: findVariantUrl(variants),
  };
};
