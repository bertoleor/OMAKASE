export type Language = "es" | "en" | "pt";

export interface Dictionary {
  common: {
    loading: string;
    next: string;
    back: string;
    confirm: string;
    today: string;
    tomorrow: string;
    yes: string;
    no: string;
    closed: string;
    error: string;
    success: string;
    processing: string;
  };
  wizard: {
    steps: {
      quantity: string;
      date: string;
      time: string;
    };
    pax: string;
  };
  quantity: {
    title: string;
    label: string;
    description: string;
  };
  date: {
    title: string;
    select_date: string;
    month: string;
  };
  time: {
    title: string;
    select_time: string;
    no_slots: string;
  };
  zones: {
    title: string;
    select_zone: string;
    indoor_tables: {
      name: string;
      description: string;
    };
    outdoor_pergola: {
      name: string;
      description: string;
    };
    indoor_bar: {
      name: string;
      description: string;
    };
  };
  personalize: {
    title: string;
    vegetarians: string;
    restrictions: string;
    kids: string;
    requests: string;
    requests_placeholder: string;
    requests_hint: string;
  };
  auth: {
    title: string;
    description: string;
    guest: string;
    login: string;
    first_name: string;
    last_name: string;
    email_label: string;
    email_placeholder: string;
    name_label: string;
    name_placeholder: string;
    phone_label: string;
    phone_placeholder: string;
    notes_label: string;
    notes_placeholder: string;
    continue_google: string;
    continue_guest: string;
    or: string;
  };
  guarantee: {
    title: string;
    description: string;
    amount: string;
    secure_payment: string;
    payment_method: string;
    cardholder: string;
    card_number: string;
    dni: string;
    expiry: string;
    cvc: string;
    terms: string;
  };
  summary: {
    title: string;
    description: string;
    details: string;
    preferences: string;
    holder: string;
  };
  confirmation: {
    title: string;
    subtitle: string;
    booking_id: string;
    download_pdf: string;
    home: string;
    email_sent: string;
    thank_you: string;
  };
}
