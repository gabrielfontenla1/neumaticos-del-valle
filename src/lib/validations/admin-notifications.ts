/**
 * Admin Notifications Validation Schemas
 *
 * Zod schemas for admin notification system.
 */

import { z } from 'zod'

// ============================================
// Enums
// ============================================

export const notificationTypeEnum = z.enum([
  'new_order',
  'new_appointment',
  'new_review',
  'low_stock',
  'new_quote',
  'order_cancelled',
  'appointment_cancelled',
  'voucher_redeemed',
  'system',
])

export const notificationPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export type NotificationType = z.infer<typeof notificationTypeEnum>
export type NotificationPriority = z.infer<typeof notificationPriorityEnum>

// ============================================
// Base Schema
// ============================================

export const adminNotificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  priority: notificationPriorityEnum.default('medium'),

  // Reference
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).default({}),

  // Status
  is_read: z.boolean().default(false),
  read_at: z.string().datetime().nullable().optional(),
  read_by: z.string().uuid().nullable().optional(),

  // Dismissal
  is_dismissed: z.boolean().default(false),
  dismissed_at: z.string().datetime().nullable().optional(),
  dismissed_by: z.string().uuid().nullable().optional(),

  // Action
  action_url: z.string().url().nullable().optional(),
  action_taken: z.boolean().default(false),
  action_taken_at: z.string().datetime().nullable().optional(),

  // Timestamps
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable().optional(),
})

export type AdminNotification = z.infer<typeof adminNotificationSchema>

// ============================================
// Dashboard Counts Schema
// ============================================

export const dashboardCountsSchema = z.object({
  pending_orders: z.number().int().min(0),
  pending_appointments: z.number().int().min(0),
  pending_reviews: z.number().int().min(0),
  pending_quotes: z.number().int().min(0),
  low_stock_products: z.number().int().min(0),
  unread_notifications: z.number().int().min(0),
  active_vouchers: z.number().int().min(0),
  today_appointments: z.number().int().min(0),
  total_products: z.number().int().min(0),
  total_customers: z.number().int().min(0),
})

export type DashboardCounts = z.infer<typeof dashboardCountsSchema>

// ============================================
// Request Schemas
// ============================================

export const markNotificationReadRequestSchema = z.object({
  notification_id: z.string().uuid(),
})

export const dismissNotificationRequestSchema = z.object({
  notification_id: z.string().uuid(),
})

export const getNotificationsQuerySchema = z.object({
  type: notificationTypeEnum.optional(),
  priority: notificationPriorityEnum.optional(),
  is_read: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0)),
})

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadRequestSchema>
export type DismissNotificationRequest = z.infer<typeof dismissNotificationRequestSchema>
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>

// ============================================
// Response Schemas
// ============================================

export const notificationListResponseSchema = z.object({
  notifications: z.array(adminNotificationSchema),
  total: z.number().int().min(0),
  unread_count: z.number().int().min(0),
})

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>

// ============================================
// Create Notification Schema (for manual creation)
// ============================================

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  priority: notificationPriorityEnum.optional().default('medium'),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  action_url: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  expires_at: z.string().datetime().optional(),
})

export type CreateNotificationRequest = z.infer<typeof createNotificationSchema>
