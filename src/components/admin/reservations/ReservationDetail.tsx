"use client";

import { Fragment, useState } from "react";
import { sendQuickContactEmail } from "@/app/actions/admin";
import {
  X,
  Clock,
  User,
  Users,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle2,
  UserCheck,
  XCircle,
  Edit2,
  Loader2,
  CreditCard,
  Copy,
} from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  status: string;
  notes?: string;
  duration_minutes?: number;
  created_at?: string;
  payment_token?: string;
  card_brand?: string;
  card_last_four?: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
}

interface ReservationDetailProps {
  readonly booking: Booking | null;
  readonly zones: Zone[];
  readonly onClose: () => void;
  readonly onAction: (id: string, status: string) => Promise<void>;
  readonly isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: CheckCircle2,
  },
  seated: {
    label: "Sentado",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: UserCheck,
  },
  completed: {
    label: "Completada",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: XCircle,
  },
  no_show: {
    label: "No Show",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: XCircle,
  },
};

export default function ReservationDetail({
  booking,
  zones,
  onClose,
  onAction,
  isLoading,
}: ReservationDetailProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);

  if (!booking) return null;

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;

    setIsSendingContact(true);
    try {
      const subject =
        contactSubject ||
        `OMAKASE - Referente a tu reserva del ${booking.booking_date}`;
      const { success, error } = await sendQuickContactEmail(
        booking.customer_email,
        subject,
        contactMessage,
        booking.customer_name,
      );

      if (!success) throw new Error(error);

      alert("Email enviado con éxito");
      setShowContactModal(false);
      setContactMessage("");
      setContactSubject("");
    } catch (error) {
      console.error("Error sending contact email:", error);
      alert(
        error instanceof Error ? error.message : "Error al enviar el email",
      );
    } finally {
      setIsSendingContact(false);
    }
  };

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const zoneName =
    zones.find((z) => z.id === booking.zone_id)?.name || "Unknown";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default w-full h-full border-none"
        onClick={onClose}
        aria-label="Cerrar detalle"
        title="Cerrar detalle"
      />

      {/* Slide-over Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-black/80 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Detalle de Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.bgColor}`}
            >
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <button
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Editar reserva"
              title="Editar reserva"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Date */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-white/40" />
              <span className="text-white capitalize">
                {formatDate(booking.booking_date)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-white/40" />
              <span className="text-2xl font-bold text-white">
                {booking.booking_time}
              </span>
              {booking.duration_minutes && (
                <span className="text-sm text-white/60">
                  ({booking.duration_minutes} min)
                </span>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Cliente
              </h3>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
              >
                <Mail className="w-3 h-3" />
                <span>Contactar</span>
              </button>
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-white/40" />
                <span className="text-white font-medium">
                  {booking.customer_name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-white/40" />
                <a
                  href={`tel:${booking.customer_phone}`}
                  className="text-blue-400 hover:underline"
                >
                  {booking.customer_phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white/40" />
                <a
                  href={`mailto:${booking.customer_email}`}
                  className="text-blue-400 hover:underline text-sm"
                >
                  {booking.customer_email}
                </a>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Detalles
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-white/40" />
                  <span className="text-white">Comensales</span>
                </div>
                <span className="text-xl font-bold text-white">
                  {booking.pax}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-white/40" />
                  <span className="text-white">Zona</span>
                </div>
                <span className="text-white/80">{zoneName}</span>
              </div>
            </div>
          </div>

          {/* Payment Guarantee */}
          {booking.payment_token && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Garantía
              </h3>
              <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-white/40" />
                    <span className="text-white capitalize">
                      {booking.card_brand || "Tarjeta"} ••••{" "}
                      {booking.card_last_four || "????"}
                    </span>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Tokenizado
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-1">Payment Token</p>
                  <div className="flex items-center space-x-2 bg-black/40 p-2 rounded text-xs font-mono text-white/70 break-all">
                    <span>{booking.payment_token}</span>
                    <button
                      onClick={() =>
                        booking.payment_token &&
                        navigator.clipboard.writeText(booking.payment_token)
                      }
                      className="p-1 hover:text-white transition-colors"
                      title="Copiar Token"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                Notas
              </h3>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-white/40 mt-0.5" />
                  <p className="text-white/80 text-sm">{booking.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Acciones
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {booking.status === "pending" && (
                <button
                  onClick={() => onAction(booking.id, "confirmed")}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirmar</span>
                </button>
              )}
              {booking.status === "confirmed" && (
                <button
                  onClick={() => onAction(booking.id, "seated")}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Sentar</span>
                </button>
              )}
              {booking.status === "seated" && (
                <button
                  onClick={() => onAction(booking.id, "completed")}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-xl hover:bg-gray-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Completar</span>
                </button>
              )}
              {["pending", "confirmed"].includes(booking.status) && (
                <button
                  onClick={() => onAction(booking.id, "cancelled")}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Cancelar</span>
                </button>
              )}
              {booking.status === "confirmed" && (
                <button
                  onClick={() => onAction(booking.id, "no_show")}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>No Show</span>
                </button>
              )}
            </div>
          </div>

          {/* Audit Info */}
          {booking.created_at && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/40">
                Creada: {new Date(booking.created_at).toLocaleString("es-ES")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-default"
            onClick={() => setShowContactModal(false)}
            aria-label="Cerrar modal"
            title="Cerrar modal"
          />
          <form
            onSubmit={handleSendContact}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">
                Contactar Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-white/40 hover:text-white"
                aria-label="Cerrar modal"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="contact-subject"
                  className="text-xs font-medium text-white/40 uppercase block mb-1"
                >
                  Asunto (Opcional)
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="OMAKASE - Información sobre su reserva"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none placeholder:text-white/20"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="text-xs font-medium text-white/40 uppercase block mb-1"
                >
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Escribe el mensaje para el cliente..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none placeholder:text-white/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSendingContact || !contactMessage}
                className="flex-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-white/40 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                {isSendingContact ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Enviar Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Fragment>
  );
}
