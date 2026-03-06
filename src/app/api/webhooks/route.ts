import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Webhook API Endpoint
 *
 * Handles incoming webhook events from:
 * - Supabase Database (via database webhooks)
 * - External services (payment providers, etc.)
 *
 * Events supported:
 * - bookings: created, updated, deleted, status_changed
 * - payments: succeeded, failed, refunded
 * - tables: created, updated, deleted
 * - zones: created, updated, deleted
 */

interface WebhookPayload {
  type: string;
  table: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown>;
  timestamp?: string;
}

interface BookingEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "bookings";
  record: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    booking_date: string;
    booking_time: string;
    pax: number;
    status: string;
    zone_id?: string;
    table_id?: string;
    deposit_amount?: number;
  };
  old_record?: {
    id: string;
    status?: string;
  };
}

/**
 * Verify webhook signature (for external services)
 */
function verifySignature(request: NextRequest, secret: string): boolean {
  const signature = request.headers.get("x-webhook-signature");
  if (!signature) return false;

  // In production, use HMAC verification
  // For now, we use a simple token-based verification
  const token = request.headers.get("x-webhook-token");
  return token === secret;
}

/**
 * Handle booking-related webhook events
 */
async function handleBookingEvent(event: BookingEvent): Promise<void> {
  switch (event.type) {
    case "INSERT":
      logger.info("Booking created via webhook", {
        context: "webhook",
        action: "booking_created",
        bookingId: event.record.id,
        customer: event.record.customer_name,
        date: event.record.booking_date,
        time: event.record.booking_time,
      });

      // Placeholder: Send notification to admin (implementar cuando esté listo)
      break;

    case "UPDATE":
      logger.info("Booking updated via webhook", {
        context: "webhook",
        action: "booking_updated",
        bookingId: event.record.id,
        oldStatus: event.old_record?.status,
        newStatus: event.record.status,
      });

      // Handle status changes
      if (event.old_record?.status !== event.record.status) {
        await handleStatusChange(event.record.id, event.old_record?.status, event.record.status);
      }
      break;

    case "DELETE":
      logger.info("Booking deleted via webhook", {
        context: "webhook",
        action: "booking_deleted",
        bookingId: event.old_record?.id,
      });

      // Placeholder: Release table capacity (implementar cuando esté listo)
      break;
  }
}

/**
 * Handle booking status changes
 */
async function handleStatusChange(
  bookingId: string,
  oldStatus: string | undefined,
  newStatus: string,
): Promise<void> {
  // Map status transitions
  const statusActions: Record<string, () => Promise<void>> = {
    pending_confirmed: async () => {
      // Send confirmation email
      logger.info("Sending confirmation email", { bookingId, action: "send_confirmation" });
    },
    confirmed_seated: async () => {
      // Update table occupancy
      logger.info("Booking seated, updating occupancy", { bookingId, action: "update_occupancy" });
    },
    confirmed_no_show: async () => {
      // Mark as no-show
      logger.info("Marking booking as no-show", { bookingId, action: "mark_no_show" });
    },
    confirmed_cancelled: async () => {
      // Release table, send cancellation
      logger.info("Booking cancelled", { bookingId, action: "booking_cancelled" });
    },
    seated_completed: async () => {
      // Free up the table
      logger.info("Booking completed, releasing table", { bookingId, action: "release_table" });
    },
  };

  const key = `${oldStatus || "none"}_${newStatus}`;
  const action = statusActions[key];

  if (action) {
    await action();
  }
}

/**
 * Handle payment webhook events
 */
async function handlePaymentEvent(payload: WebhookPayload): Promise<void> {
  const { type, record } = payload;

  logger.info("Payment event received", {
    context: "webhook",
    action: "payment_event",
    eventType: type,
    bookingId: typeof record?.booking_id === "string" ? record.booking_id : "",
  });

  switch (type) {
    case "payment.succeeded":
      // Update booking payment status
      // Send confirmation
      break;
    case "payment.failed":
      // Notify admin
      // Update booking status
      break;
    case "payment.refunded":
      // Update booking
      // Send refund confirmation
      break;
  }
}

/**
 * POST handler for webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook signature (optional for internal Supabase webhooks)
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && !verifySignature(request, webhookSecret)) {
      logger.warn("Invalid webhook signature", { context: "webhook", action: "invalid_signature" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();

    // Validate payload
    if (!payload.type || !payload.table) {
      return NextResponse.json(
        { error: "Invalid payload: missing type or table" },
        { status: 400 },
      );
    }

    logger.info("Webhook received", {
      context: "webhook",
      action: "received",
      type: payload.type,
      table: payload.table,
    });

    // Route to appropriate handler
    switch (payload.table) {
      case "bookings":
        await handleBookingEvent(payload as unknown as BookingEvent);
        break;

      case "payments":
        await handlePaymentEvent(payload);
        break;

      case "tables":
      case "zones":
        // Log but don't process (handled by client-side realtime)
        logger.info("Table or zone change detected", {
          context: "webhook",
          action: "table_or_zone_change",
          table: payload.table,
        });
        break;

      default:
        logger.warn("Unknown table in webhook", {
          context: "webhook",
          action: "unknown_table",
          table: payload.table,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Webhook processing error", error instanceof Error ? error : undefined, {
      context: "webhook",
      action: "error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET handler for webhook verification
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is active",
    supportedEvents: [
      "bookings:INSERT",
      "bookings:UPDATE",
      "bookings:DELETE",
      "payments:succeeded",
      "payments:failed",
      "payments:refunded",
    ],
  });
}
