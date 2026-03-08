// Dinamismo por paquete (service_type): Vault slots, Contratos, Justificaciones

export type ServiceType = "web" | "ecommerce" | "seo" | "factura_electronica";

export const VAULT_SLOTS: Record<ServiceType, { key: string; label: string }[]> = {
  web: [
    { key: "dni", label: "DNI/NIF" },
    { key: "escrituras", label: "Escrituras" },
    { key: "certificado_ss", label: "Certificado Seguridad Social" },
    { key: "alta_autonomos", label: "Alta autónomos (si aplica)" },
  ],
  ecommerce: [
    { key: "dni", label: "DNI/NIF" },
    { key: "escrituras", label: "Escrituras" },
    { key: "certificado_ss", label: "Certificado Seguridad Social" },
    { key: "alta_autonomos", label: "Alta autónomos (si aplica)" },
    { key: "datos_tienda", label: "Datos de acceso tienda" },
  ],
  seo: [
    { key: "dni", label: "DNI/NIF" },
    { key: "escrituras", label: "Escrituras" },
    { key: "certificado_ss", label: "Certificado Seguridad Social" },
  ],
  factura_electronica: [
    { key: "dni", label: "DNI/NIF" },
    { key: "escrituras", label: "Escrituras" },
    { key: "certificado_ss", label: "Certificado Seguridad Social" },
    { key: "sistema_facturacion", label: "Sistema de facturación actual" },
  ],
};

export const AGREEMENT_TEMPLATES: Record<ServiceType, { title: string; clauses: string[] }> = {
  web: {
    title: "Acuerdo de prestación de servicios - Kit Digital Web",
    clauses: [
      "Objeto: desarrollo y entrega de sitio web conforme a Kit Digital.",
      "Duración y mantenimiento según condiciones Red.es.",
    ],
  },
  ecommerce: {
    title: "Acuerdo - Kit Digital Ecommerce",
    clauses: [
      "Objeto: implantación de solución ecommerce.",
      "Incluye formación y documentación.",
    ],
  },
  seo: {
    title: "Acuerdo - Kit Digital SEO",
    clauses: [
      "Objeto: plan de posicionamiento SEO según Kit Digital.",
    ],
  },
  factura_electronica: {
    title: "Acuerdo - Kit Digital Factura Electrónica",
    clauses: [
      "Objeto: implantación de facturación electrónica.",
    ],
  },
};

export type JustificationPhase = "phase_i" | "phase_ii";

export const TECH_CHECKLIST: Record<
  ServiceType,
  Record<JustificationPhase, { key: string; label: string }[]>
> = {
  web: {
    phase_i: [
      { key: "captura_home", label: "Captura página de inicio" },
      { key: "accesibilidad", label: "Informe accesibilidad" },
      { key: "formacion", label: "Evidencia formación" },
    ],
    phase_ii: [
      { key: "mantenimiento", label: "Evidencia mantenimiento" },
    ],
  },
  ecommerce: {
    phase_i: [
      { key: "captura_pasarela", label: "Captura pasarela de pago" },
      { key: "accesibilidad", label: "Accesibilidad" },
      { key: "catalogo", label: "Catálogo de productos" },
      { key: "formacion", label: "Evidencia formación" },
    ],
    phase_ii: [
      { key: "mantenimiento", label: "Evidencia mantenimiento" },
    ],
  },
  seo: {
    phase_i: [
      { key: "informe_seo", label: "Informe SEO" },
      { key: "keywords", label: "Keywords trabajadas" },
      { key: "formacion", label: "Evidencia formación" },
    ],
    phase_ii: [
      { key: "mantenimiento", label: "Evidencia mantenimiento" },
    ],
  },
  factura_electronica: {
    phase_i: [
      { key: "captura_factura", label: "Captura factura emitida" },
      { key: "integracion", label: "Integración sistema" },
      { key: "formacion", label: "Evidencia formación" },
    ],
    phase_ii: [
      { key: "mantenimiento", label: "Evidencia mantenimiento" },
    ],
  },
};

export function getVaultSlots(serviceType: ServiceType) {
  return VAULT_SLOTS[serviceType] ?? VAULT_SLOTS.web;
}

export function getAgreementTemplate(serviceType: ServiceType) {
  return AGREEMENT_TEMPLATES[serviceType] ?? AGREEMENT_TEMPLATES.web;
}

export function getTechChecklist(
  serviceType: ServiceType,
  phase: JustificationPhase
) {
  const byService = TECH_CHECKLIST[serviceType] ?? TECH_CHECKLIST.web;
  return byService[phase] ?? [];
}
