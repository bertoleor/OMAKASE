import BookingWizard from "@/components/booking/BookingWizard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.book();

export default function BookingPage() {
  return <BookingWizard />;
}
