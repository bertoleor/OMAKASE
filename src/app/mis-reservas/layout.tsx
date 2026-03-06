import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.myReservations();

export default function MyReservationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
