'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  scanMode?: 'qrcode' | 'barcode';
}

export function CameraScanner({ onScan, onClose, scanMode = 'qrcode' }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    let scanner: any = null;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        // Configuração base
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        // Para códigos de barras, usamos múltiplas formatas
        const formats = scanMode === 'barcode'
          ? [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.CODABAR,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ]
          : undefined;

        scanner = new Html5QrcodeScanner(
          'qr-reader',
          { ...config, formatsToSupport: formats },
          false
        );

        const onScanSuccess = (decodedText: string) => {
          onScan(decodedText);
        };

        const onScanError = (errorMessage: string) => {
          // Silencioso
        };

        scanner.render(onScanSuccess, onScanError);
      } catch (error) {
        console.error('Erro ao inicializar scanner:', error);
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scanMode, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {scanMode === 'qrcode' ? 'Ler QR Code' : 'Ler Código de Barras'}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div id="qr-reader" ref={scannerRef} className="w-full h-64 rounded-lg overflow-hidden"></div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            {scanMode === 'qrcode'
              ? 'Aponte a câmera para o QR Code da NFC-e'
              : 'Aponte a câmera para o código de barras da NF-e'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
