"use client";

import { Certificate } from "@/lib/types/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface CertificateDisplayProps {
  certificate: Certificate;
  onDownload?: (certificate: Certificate) => void;
}

export default function CertificateDisplay({
  certificate,
  onDownload,
}: CertificateDisplayProps) {
  const [isViewing, setIsViewing] = useState(false);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(certificate);
      return;
    }

    // Default download behavior
    const link = document.createElement("a");
    link.href = certificate.file.base64;
    link.download = certificate.file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    setIsViewing(true);
    // Open in new window
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${certificate.name}</title></head>
          <body style="margin:0; padding:20px; background:#f5f5f5;">
            ${certificate.file.mimeType === "application/pdf" ? (
              `<iframe src="${certificate.file.base64}" width="100%" height="100%" style="border:none; min-height:600px;"></iframe>`
            ) : (
              `<img src="${certificate.file.base64}" alt="${certificate.name}" style="max-width:100%; height:auto;" />`
            )}
          </body>
        </html>
      `);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{certificate.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {certificate.verified ? (
              <CheckCircle className="h-5 w-5 text-green-500" title="Verificado" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" title="No verificado" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-medium">Tipo:</span> {certificate.type}
          </p>
          {certificate.issuedBy && (
            <p>
              <span className="font-medium">Emitido por:</span> {certificate.issuedBy}
            </p>
          )}
          {certificate.issuedDate && (
            <p>
              <span className="font-medium">Fecha de emisión:</span>{" "}
              {certificate.issuedDate.toDate?.().toLocaleDateString() || "N/A"}
            </p>
          )}
          {certificate.expiryDate && (
            <p>
              <span className="font-medium">Fecha de expiración:</span>{" "}
              {certificate.expiryDate.toDate?.().toLocaleDateString() || "N/A"}
            </p>
          )}
          <p>
            <span className="font-medium">Tamaño:</span> {certificate.file.sizeKB.toFixed(0)}KB
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

