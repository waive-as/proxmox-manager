import { z } from 'zod';

// User schemas
export const UserRoleSchema = z.enum(['admin', 'readonly', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;


export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

// User management schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: UserRoleSchema.default('user')
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  password: z.string().min(8).optional()
});

export const ToggleUserStatusSchema = z.object({
  isActive: z.boolean()
});

// Proxmox server schemas
export const CreateServerSchema = z.object({
  name: z.string().min(1).max(100),
  host: z.string().min(1),
  port: z.number().min(1).max(65535).default(8006),
  tokenId: z.string().min(1),
  tokenSecret: z.string().min(1),
  description: z.string().optional()
});

export const UpdateServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  host: z.string().min(1).optional(),
  port: z.number().min(1).max(65535).optional(),
  tokenId: z.string().min(1).optional(),
  tokenSecret: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

// API response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional()
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// JWT payload schema
export const JWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  iat: z.number(),
  exp: z.number()
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CreateServerInput = z.infer<typeof CreateServerSchema>;
export type UpdateServerInput = z.infer<typeof UpdateServerSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
