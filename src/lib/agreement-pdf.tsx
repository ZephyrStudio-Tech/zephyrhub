"use server";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { getAgreementTemplate } from "./service-config";
import type { ServiceType } from "./service-config";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
  },
  clause: {
    marginBottom: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
  },
});

export function AgreementDocument({
  companyName,
  serviceType,
  date,
}: {
  companyName: string;
  serviceType: ServiceType;
  date: string;
}) {
  const template = getAgreementTemplate(serviceType);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.clause}>
            Empresa: {companyName}
          </Text>
          <Text style={styles.clause}>
            Fecha: {date}
          </Text>
          {template.clauses.map((clause, i) => (
            <Text key={i} style={styles.clause}>
              {clause}
            </Text>
          ))}
        </View>
        <Text style={styles.footer}>
          ZephyrStudio · Kit Digital · Documento generado por ZephyrOS
        </Text>
      </Page>
    </Document>
  );
}
