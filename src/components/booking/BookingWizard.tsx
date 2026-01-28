"use client";

import { useEffect } from "react";
import { useBookingStore } from "@/store/booking-store";
import { AnimatePresence, motion } from "framer-motion";
import WizardHeader from "./WizardHeader";
import QuantityStep from "./steps/QuantityStep";
import DateStep from "./steps/DateStep";
import TimeStep from "./steps/TimeStep";

import ZonesStep from "./steps/ZonesStep";
import PersonalizeStep from "./steps/PersonalizeStep";
import AuthStep from "./steps/AuthStep";
import GuaranteeStep from "./steps/GuaranteeStep";
import ConfirmationStep from "./steps/ConfirmationStep";

const variants = {
  enter: { x: 20, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

export default function BookingWizard() {
  const currentStep = useBookingStore((state) => state.currentStep);
  const fetchSettings = useBookingStore((state) => state.fetchSettings);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <QuantityStep />;
      case 2:
        return <DateStep />;
      case 3:
        return <TimeStep />;
      case 4:
        return <ZonesStep />;
      case 5:
        return <PersonalizeStep />;
      case 6:
        return <AuthStep />;
      case 7:
        return <GuaranteeStep />;
      case 8:
        return <ConfirmationStep />;
      default:
        return <QuantityStep />;
    }
  };

  return (
    <>
      {/* Global Background */}
      <div className="fixed inset-0 z-[-1]">
        {/* Placeholder Dark Restaurant Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')]" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* The Stage / Card */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="
            relative w-full max-w-md 
            bg-black/40 backdrop-blur-2xl 
            border border-white/10 shadow-2xl rounded-3xl 
            overflow-hidden flex flex-col max-h-[90vh]
          "
        >
          {/* Sticky Header */}
          <div className="p-6 pb-2 z-10 bg-gradient-to-b from-black/20 to-transparent">
            <WizardHeader />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative booking-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
