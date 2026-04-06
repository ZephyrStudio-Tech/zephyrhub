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

export function getVaultSlots(serviceType: ServiceType) {
  return VAULT_SLOTS[serviceType] ?? VAULT_SLOTS.web;
}

export function getAgreementTemplate(serviceType: ServiceType) {
  return AGREEMENT_TEMPLATES[serviceType] ?? AGREEMENT_TEMPLATES.web;
}
