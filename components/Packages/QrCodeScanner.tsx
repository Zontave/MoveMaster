
import React, { useEffect, useState, useRef } from 'react';
// Assuming html5-qrcode is loaded via CDN and available globally
// declare var Html5QrcodeScanner: any;
// declare var Html5Qrcode: any; // For direct control if needed

interface QrCodeScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanFailure?: (error: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

export const QrCodeScanner: React.FC<QrCodeScannerProps> = ({
  onScanSuccess,
  onScanFailure = (error) => console.error(`QR Code scan error: ${error}`),
  fps = 10,
  qrbox = 250,
  aspectRatio,
  disableFlip = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<any>(null); // To store Html5Qrcode instance
  const scannerRegionId = "qr-scanner-region";

  useEffect(() => {
    // Dynamically check for Html5Qrcode availability
    if (typeof (window as any).Html5Qrcode !== 'undefined') {
      const html5QrCode = new (window as any).Html5Qrcode(scannerRegionId, /* verbose= */ false);
      scannerRef.current = html5QrCode;

      const config = { 
        fps, 
        qrbox, 
        aspectRatio, 
        disableFlip 
      };

      const startScanner = async () => {
        try {
          await html5QrCode.start(
            { facingMode: "environment" }, // prefer back camera
            config,
            (decodedText: string, decodedResult: any) => {
              onScanSuccess(decodedText, decodedResult);
            },
            (errorMessage: string) => {
              // This is more of a continuous error/warning callback, not necessarily fatal
              // onScanFailure(errorMessage); 
            }
          );
          setErrorMessage(null);
        } catch (err: any) {
          console.error("Error starting QR scanner:", err);
          setErrorMessage(`Failed to start scanner: ${err.message || err}. Ensure camera permission is granted.`);
          onScanFailure(err.message || err);
        }
      };
      
      startScanner();

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((err: any) => {
            console.error("Error stopping QR scanner:", err);
          });
        }
      };
    } else {
      setErrorMessage("QR Code scanning library (Html5Qrcode) not loaded. Please ensure it's included.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fps, qrbox, aspectRatio, disableFlip]); // Dependencies that re-initialize scanner

  return (
    <div className="w-full">
      <div id={scannerRegionId} className="border border-gray-300 rounded-md bg-gray-100" style={{ width: '100%', minHeight: '300px' }}>
        {/* The library will render the video feed here */}
      </div>
      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      <p className="mt-2 text-xs text-gray-500 text-center">Point your camera at a QR code.</p>
    </div>
  );
};
