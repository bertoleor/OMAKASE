"use client";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useCallback } from "react";
import { Check, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import cardValidator from "card-validator";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

// ============================================================
// TYPES & VALIDATIONS
// ============================================================
interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  customerDni: string;
}

interface FieldValidation {
  isValid: boolean;
  isPotentiallyValid: boolean;
  error?: string;
}

type CardBrand = "visa" | "mastercard" | "american-express" | "cabal" | "naranja" | "unknown";

// Card Brand Icon Component
const CardBrandIcon = ({ brand }: { brand: CardBrand }) => {
  switch (brand) {
    case "visa":
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="6" fill="#1A1F71" />
          <path d="M19.5 30.5L21.5 17.5H25L23 30.5H19.5Z" fill="white" />
          <path
            d="M32.5 17.7C31.7 17.4 30.5 17 29 17C25.5 17 23 18.9 23 21.5C23 23.5 24.8 24.5 26.2 25.2C27.6 25.9 28.1 26.4 28.1 27C28.1 28 26.9 28.4 25.8 28.4C24.2 28.4 23.4 28.2 22.1 27.6L21.6 27.4L21 31C22.1 31.4 24 31.8 26 31.8C29.8 31.8 32.2 29.9 32.2 27.1C32.2 25.5 31.2 24.3 29.1 23.3C27.9 22.7 27.1 22.3 27.1 21.6C27.1 21 27.8 20.4 29.2 20.4C30.4 20.4 31.3 20.6 32 21L32.4 21.2L33 17.9L32.5 17.7Z"
            fill="white"
          />
          <path
            d="M38 17.5H35.5C34.7 17.5 34.1 17.7 33.8 18.5L28.5 30.5H32.3L33 28.5H37.5L37.9 30.5H41.5L38 17.5ZM34 25.5C34.3 24.7 35.5 21.5 35.5 21.5C35.5 21.5 35.8 20.7 36 20.2L36.3 21.4C36.3 21.4 37 24.5 37.2 25.5H34Z"
            fill="white"
          />
          <path
            d="M17 17.5L13.5 26.5L13.1 24.7C12.4 22.5 10.4 20 8 18.9L11.3 30.5H15.2L21 17.5H17Z"
            fill="white"
          />
          <path
            d="M11 17.5H5L5 17.8C9.5 18.9 12.5 21.6 13.5 24.7L12.4 18.6C12.2 17.8 11.6 17.5 11 17.5Z"
            fill="#F9A533"
          />
        </svg>
      );
    case "mastercard":
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="6" fill="#000" />
          <circle cx="19" cy="24" r="10" fill="#EB001B" />
          <circle cx="29" cy="24" r="10" fill="#F79E1B" />
          <path
            d="M24 16.5C26.4 18.4 28 21 28 24C28 27 26.4 29.6 24 31.5C21.6 29.6 20 27 20 24C20 21 21.6 18.4 24 16.5Z"
            fill="#FF5F00"
          />
        </svg>
      );
    case "american-express":
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="6" fill="#006FCF" />
          <path
            d="M7 28H9L9.5 26.5H11.5L12 28H17V26.5L17.5 28H20.5L21 26.5V28H35V25.5L35.5 26H38.5V28H41V20H38.5L38 21.5L37.5 20H34V21.5L33.5 20H28C28 20 27 20 26.5 20.5L26 20H7V28Z"
            fill="white"
          />
          <text x="24" y="26" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
            AMEX
          </text>
        </svg>
      );
    case "cabal":
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="6" fill="#00529B" />
          <circle cx="24" cy="24" r="12" fill="#FFD200" />
          <text x="24" y="28" textAnchor="middle" fill="#00529B" fontSize="8" fontWeight="bold">
            C
          </text>
        </svg>
      );
    case "naranja":
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="6" fill="#FF6B00" />
          <circle cx="24" cy="24" r="12" fill="white" />
          <text x="24" y="28" textAnchor="middle" fill="#FF6B00" fontSize="8" fontWeight="bold">
            N
          </text>
        </svg>
      );
    default:
      return <CreditCard className="w-6 h-6 text-white/40" />;
  }
};

// Validation Helpers
const detectCardBrand = (cardNumber: string): CardBrand => {
  const cleaned = cardNumber.replaceAll(/\s/g, "");
  if (
    cleaned.startsWith("604") ||
    cleaned.startsWith("589657") ||
    cleaned.startsWith("6042") ||
    cleaned.startsWith("6043") ||
    cleaned.startsWith("6044") ||
    cleaned.startsWith("6045")
  )
    return "cabal";
  if (cleaned.startsWith("589562")) return "naranja";

  const validation = cardValidator.number(cleaned);
  if (validation.card) {
    switch (validation.card.type) {
      case "visa":
        return "visa";
      case "mastercard":
        return "mastercard";
      case "american-express":
        return "american-express";
      default:
        return "unknown";
    }
  }
  return "unknown";
};

const validateCardNumber = (value: string): FieldValidation => {
  const cleaned = value.replaceAll(/\s/g, "");
  if (!cleaned) return { isValid: false, isPotentiallyValid: true };
  const validation = cardValidator.number(cleaned);
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid,
    error: validation.isPotentiallyValid ? undefined : "Número de tarjeta inválido",
  };
};

const validateExpiry = (value: string): FieldValidation => {
  if (!value) return { isValid: false, isPotentiallyValid: true };
  const validation = cardValidator.expirationDate(value);
  if (validation.isValid && validation.month && validation.year) {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    const expYear = Number.parseInt(validation.year, 10);
    const expMonth = Number.parseInt(validation.month, 10);
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return {
        isValid: false,
        isPotentiallyValid: false,
        error: "Tarjeta vencida",
      };
    }
  }
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid,
    error: validation.isPotentiallyValid ? undefined : "Fecha inválida",
  };
};

const validateCVV = (value: string, cardBrand: CardBrand): FieldValidation => {
  if (!value) return { isValid: false, isPotentiallyValid: true };
  const expectedLength = cardBrand === "american-express" ? 4 : 3;
  const validation = cardValidator.cvv(value, expectedLength);
  return {
    isValid: validation.isValid,
    isPotentiallyValid: validation.isPotentiallyValid,
    error: validation.isPotentiallyValid ? undefined : "CVC inválido",
  };
};

const validateDNI = (value: string): FieldValidation => {
  const cleaned = value.replaceAll(/[^\d]/g, "");
  if (!cleaned) return { isValid: false, isPotentiallyValid: true };
  // User requested strictly 7-8 digits for DNI formatting
  const isValidDNI = cleaned.length >= 7 && cleaned.length <= 8;
  return {
    isValid: isValidDNI,
    isPotentiallyValid: cleaned.length <= 8,
    error: cleaned.length > 8 ? "Máximo 8 dígitos" : undefined,
  };
};

const validateRequired = (value: string): FieldValidation => ({
  isValid: value.trim().length > 0,
  isPotentiallyValid: true,
});

// Input Formatters
const formatCardNumber = (value: string): string => {
  const cleaned = value.replaceAll(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(" ").substring(0, 19);
};

const formatExpiry = (value: string): string => {
  const cleaned = value.replaceAll(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  }
  return cleaned;
};

const formatDNI = (value: string): string => {
  // Remove non-digits
  const cleaned = value.replaceAll(/\D/g, "");
  // Limit to 8 digits
  const truncated = cleaned.substring(0, 8);
  // Format with dots: XX.XXX.XXX
  return new Intl.NumberFormat("es-AR").format(Number(truncated)).replaceAll(",", ".");
};

// Validation Indicator
const ValidationIndicator = ({
  validation,
  showIcon = true,
}: {
  validation: FieldValidation;
  showIcon?: boolean;
}) => {
  if (!showIcon) return null;
  return (
    <AnimatePresence mode="wait">
      {!validation.isPotentiallyValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function GuaranteeStep() {
  const { draftBooking, updateDraft, setStep } = useBookingStore();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Payment Form State
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    cardholderName:
      draftBooking.customer?.firstName && draftBooking.customer?.lastName
        ? `${draftBooking.customer.firstName} ${draftBooking.customer.lastName}`.toUpperCase()
        : "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    customerDni: draftBooking.customerDni || "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const cardBrand = detectCardBrand(paymentData.cardNumber);

  // Validations
  const validations = {
    cardholderName: validateRequired(paymentData.cardholderName),
    cardNumber: validateCardNumber(paymentData.cardNumber),
    cardExpiry: validateExpiry(paymentData.cardExpiry),
    cardCvv: validateCVV(paymentData.cardCvv, cardBrand),
    customerDni: validateDNI(paymentData.customerDni),
  };

  const allValid = Object.values(validations).every((v) => v.isValid) && policyAccepted;

  // Handlers
  const handleChange = useCallback(
    (field: keyof PaymentFormData, value: string) => {
      let formattedValue = value;
      switch (field) {
        case "cardNumber":
          formattedValue = formatCardNumber(value);
          break;
        case "cardExpiry":
          formattedValue = formatExpiry(value);
          break;
        case "customerDni":
          formattedValue = formatDNI(value);
          break;
        case "cardholderName":
          formattedValue = value.toUpperCase();
          break;
        case "cardCvv":
          formattedValue = value
            .replaceAll(/\D/g, "")
            .substring(0, cardBrand === "american-express" ? 4 : 3);
          break;
      }
      setPaymentData((prev) => ({ ...prev, [field]: formattedValue }));
    },
    [cardBrand],
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getInputClasses = (field: keyof typeof validations) => {
    const validation = validations[field];
    const isTouched = touched[field];
    let borderClass = "border-white/10";
    let ringClass = "";

    if (isTouched && !validation.isPotentiallyValid) {
      borderClass = "border-red-500/50";
      ringClass = "ring-1 ring-red-500/30";
    }

    return cn(
      "w-full bg-white/5 border rounded-xl px-4 py-3 text-white",
      "placeholder:text-white/20",
      "focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20",
      "transition-all duration-300 font-light",
      // Style autofill to match dark theme
      "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-all [&:-webkit-autofill]:duration-[5000s]",
      "[&:-webkit-autofill]:[-webkit-text-fill-color:white !important]",
      borderClass,
      ringClass,
    );
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!allValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    startTransition(async () => {
      try {
        const cardLastFour = paymentData.cardNumber.replaceAll(/\s/g, "").slice(-4);

        // NOTE: Integrate payment provider (Stripe/MercadoPago)
        // Storing card reference without tokenization for now.
        updateDraft({
          cardBrand: cardBrand,
          cardLastFour: cardLastFour,
          customerDni: paymentData.customerDni,
        });

        setStep(8);
      } catch (e) {
        console.error("Payment processing error:", e);
        setSubmitError("No pudimos procesar tu pago. Intenta nuevamente.");
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t("guarantee.title")}
        </h2>
        <p className="text-white/40 text-sm">{t("guarantee.description")}</p>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <h3 className="text-white/80 text-sm uppercase tracking-wider font-medium">
          {t("guarantee.payment_method")}
        </h3>

        {/* Cardholder Name */}
        <div className="space-y-2">
          <label
            htmlFor="cardholderName"
            className="text-xs text-white/50 uppercase tracking-wider"
          >
            {t("guarantee.cardholder")}
          </label>
          <div className="relative">
            <input
              id="cardholderName"
              type="text"
              required
              value={paymentData.cardholderName}
              onChange={(e) => handleChange("cardholderName", e.target.value)}
              onBlur={() => handleBlur("cardholderName")}
              className={getInputClasses("cardholderName")}
              placeholder="JUAN PEREZ"
            />
            <ValidationIndicator
              validation={validations.cardholderName}
              showIcon={touched.cardholderName}
            />
          </div>
        </div>

        {/* Card Number */}
        <div className="space-y-2">
          <label htmlFor="cardNumber" className="text-xs text-white/50 uppercase tracking-wider">
            {t("guarantee.card_number")}
          </label>
          <div className="relative group">
            <input
              id="cardNumber"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              value={paymentData.cardNumber}
              onChange={(e) => handleChange("cardNumber", e.target.value)}
              onBlur={() => handleBlur("cardNumber")}
              className={cn(getInputClasses("cardNumber"), "pr-14")}
              placeholder="XXXX XXXX XXXX XXXX"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CardBrandIcon brand={cardBrand} />
            </div>
          </div>
        </div>

        {/* DNI */}
        <div className="space-y-2">
          <label htmlFor="customerDni" className="text-xs text-white/50 uppercase tracking-wider">
            {t("guarantee.dni")}
          </label>
          <div className="relative">
            <input
              id="customerDni"
              type="text"
              inputMode="numeric"
              required
              value={paymentData.customerDni}
              onChange={(e) => handleChange("customerDni", e.target.value)}
              onBlur={() => handleBlur("customerDni")}
              className={getInputClasses("customerDni")}
              placeholder="XX XXX XXX"
            />
            <ValidationIndicator
              validation={validations.customerDni}
              showIcon={touched.customerDni}
            />
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="cardExpiry" className="text-xs text-white/50 uppercase tracking-wider">
              {t("guarantee.expiry")}
            </label>
            <input
              id="cardExpiry"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              required
              value={paymentData.cardExpiry}
              onChange={(e) => handleChange("cardExpiry", e.target.value)}
              onBlur={() => handleBlur("cardExpiry")}
              className={getInputClasses("cardExpiry")}
              placeholder="MM/AA"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cardCvv" className="text-xs text-white/50 uppercase tracking-wider">
              {t("guarantee.cvc")}
            </label>
            <input
              id="cardCvv"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              required
              value={paymentData.cardCvv}
              onChange={(e) => handleChange("cardCvv", e.target.value)}
              onBlur={() => handleBlur("cardCvv")}
              className={getInputClasses("cardCvv")}
              placeholder="•••"
              maxLength={cardBrand === "american-express" ? 4 : 3}
            />
          </div>
        </div>
      </div>

      {/* Terms */}
      {/* Terms */}
      <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group relative">
        <input
          type="checkbox"
          checked={policyAccepted}
          onChange={(e) => setPolicyAccepted(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            policyAccepted
              ? "bg-white border-white text-black"
              : "border-white/30 group-hover:border-white/50"
          } peer-focus:ring-1 peer-focus:ring-white/30`}
        >
          {policyAccepted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </div>
        <p className="text-sm text-white/70 leading-relaxed select-none">{t("guarantee.terms")}</p>
      </label>

      {/* Error Banner */}
      {submitError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setStep(6)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          disabled={isPending || submitting || !allValid}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white h-14 rounded-full"
        >
          {isPending || submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("common.next")
          )}
        </Button>
      </div>
    </div>
  );
}
