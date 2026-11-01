import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https?:\/\//i.test(v), "Must start with http(s)://")
  .nullable();

export const siteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Lowercase letters, numbers and dashes only"),
  url: z.string().trim().url("Enter a valid URL").refine((v) => /^https?:\/\//i.test(v), "http(s) only"),
  canonical_url: optionalUrl,
  short_description: z.string().trim().max(160),
  description: z.string().trim().max(5000),
  thumbnail_url: optionalUrl,
  favicon_url: optionalUrl,
  category_id: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, "Invalid category"),
  design_style: z.string().trim().max(80),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  position: z.coerce.number().int().min(-100000).max(100000),
  tags: z.array(z.string().trim().min(1).max(40)).max(30),
  new_category: z.string().trim().max(60).optional().default(""),
  library_ids: z.array(z.string().uuid()).max(20).optional().default([]),
});
export type SiteInput = z.infer<typeof siteSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(30).default("grid"),
  position: z.coerce.number().int().default(0),
});

export const tagSchema = z.object({ name: z.string().trim().min(1).max(40) });

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
