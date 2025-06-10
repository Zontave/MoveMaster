
import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Changed from default import to named import

interface QrCodeGeneratorProps {
  value: string;
  size?: number;
}

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({ value, size = 128 }) => {
  if (!value) return <div className="text-sm text-red-500">No value provided for QR code.</div>;

  return (
    <div className="p-2 border border-gray-300 rounded-md inline-block bg-white">
      <QRCodeSVG // Changed from QRCodeStyling to QRCodeSVG
        value={value}
        size={size}
        level="H" // High error correction level
        bgColor="#ffffff"
        fgColor="#000000"
        includeMargin={true}
      />
    </div>
  );
};