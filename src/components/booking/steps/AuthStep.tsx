"use client";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface FormDataState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

interface FieldValidation {
  isValid: boolean;
  isPotentiallyValid: boolean;
  error?: string;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================
const validateEmail = (value: string): FieldValidation => {
  if (!value) return { isValid: false, isPotentiallyValid: true };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(value),
    isPotentiallyValid: true,
  };
};

const validateRequired = (value: string): FieldValidation => ({
  isValid: value.trim().length > 0,
  isPotentiallyValid: true,
});

// ============================================================
// VALIDATION INDICATOR COMPONENT
// ============================================================
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AuthStep() {
  const { draftBooking, updateDraft, setStep } = useBookingStore();

  const [formData, setFormData] = useState<FormDataState>({
    firstName: draftBooking.customer?.firstName || "",
    lastName: draftBooking.customer?.lastName || "",
    email: draftBooking.customer?.email || "",
    phone: draftBooking.customer?.phone || "",
    notes: draftBooking.notes || "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validations
  const validations = {
    email: validateEmail(formData.email),
    phone: validateRequired(formData.phone),
    firstName: validateRequired(formData.firstName),
    lastName: validateRequired(formData.lastName),
  };

  const allValid = Object.values(validations).every((v) => v.isValid);

  // Handlers
  const handleChange = useCallback(
    (field: keyof FormDataState, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!allValid) return;

      updateDraft({
        customer: {
          ...draftBooking.customer,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        notes: formData.notes,
      });

      setStep(7); // Proceed to GuaranteeStep (Step 7) which now holds Payment
    },
    [allValid, updateDraft, draftBooking.customer, formData, setStep],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && allValid) {
        handleSubmit();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [allValid, handleSubmit]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getInputClasses = (field: keyof typeof validations) => {
    const validation = validations[field];
    const isTouched = touched[field];

    let borderClass = "border-white/10";
    let ringClass = "";

    // Only show error state
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
      "autofill:bg-transparent autofill:text-white selection:bg-white/20",
      "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-all [&:-webkit-autofill]:duration-[5000s]",
      "[&:-webkit-autofill]:[-webkit-text-fill-color:white !important]",
      borderClass,
      ringClass,
    );
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          Datos Personales
        </h2>
        <p className="text-white/40 text-sm">
          Información de contacto para su reserva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="text-xs text-white/50 uppercase tracking-wider"
            >
              Nombre
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={getInputClasses("firstName")}
              placeholder="Juan"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="text-xs text-white/50 uppercase tracking-wider"
            >
              Apellidos
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={getInputClasses("lastName")}
              placeholder="Pérez"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs text-white/50 uppercase tracking-wider"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={getInputClasses("email")}
              placeholder="juan.perez@ejemplo.com"
            />
            <ValidationIndicator
              validation={validations.email}
              showIcon={touched.email}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="text-xs text-white/50 uppercase tracking-wider"
          >
            Teléfono
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={getInputClasses("phone")}
              placeholder="+54 11 0000 0000"
            />
            <ValidationIndicator
              validation={validations.phone}
              showIcon={touched.phone}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="text-xs text-white/50 uppercase tracking-wider"
          >
            Notas / Alergias (Opcional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all font-light min-h-[60px] placeholder:text-white/20"
            placeholder="Alergia a mariscos, mesa tranquila..."
          />
        </div>

        {/* Footer - Back & Continue */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => setStep(5)}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
            aria-label="Volver"
          >
            ←
          </button>
          <Button
            type="submit"
            disabled={!allValid}
            className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider h-14 rounded-full disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white"
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
}
