import { NextResponse } from "next/server";
import {
  sendConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail,
} from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, customerName, bookingDate, bookingTime, pax, zoneName } =
      body;

    if (!type || !to || !customerName || !bookingDate || !bookingTime || !pax) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const emailData = {
      to,
      customerName,
      bookingDate,
      bookingTime,
      pax,
      zoneName,
    };

    let result;

    switch (type) {
      case "confirmation":
        result = await sendConfirmationEmail(emailData);
        break;
      case "reminder":
        result = await sendReminderEmail(emailData);
        break;
      case "cancellation":
        result = await sendCancellationEmail(emailData);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
