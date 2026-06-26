// components/camera-scanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  scanMode?: 'qrcode' | 'barcode';
}

export function CameraScanner({ onScan, onClose, scanMode = 'qrcode' }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!scannerRef.current) return;

    let isMounted = true;

    const initScanner = async () => {
      try {
        // Limpa qualquer scanner anterior
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
            await html5QrCodeRef.current.clear();
          } catch (e) {}
          html5QrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        // Configuração base
        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Configuração específica para cada modo
        let configs: any = config;
        let formats: any = undefined;

        if (scanMode === 'barcode') {
          // Para código de barras, usamos formato retangular
          configs = {
            fps: 15,
            qrbox: { width: 320, height: 100 }, // Mais largo para código de barras
            aspectRatio: 1.0,
          };
          formats = [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ];
        }

        const onScanSuccess = (decodedText: string) => {
          if (isMounted && isScanning) {
            setIsScanning(false);
            // Delay para evitar múltiplas leituras
            setTimeout(() => {
              onScan(decodedText);
            }, 300);
          }
        };

        const onScanError = (errorMessage: string) => {
          // Silencioso - evita poluir console
          // console.debug('Scan error:', errorMessage);
        };

        // Inicia com configuração correta
        await html5QrCode.start(
          { facingMode: "environment" },
          formats ? { fps: 15, qrbox: scanMode === 'barcode' ? { width: 320, height: 100 } : { width: 250, height: 250 } } : configs,
          onScanSuccess,
          onScanError
        );

        setIsScanning(true);
        setError(null);

      } catch (error) {
        console.error('Erro ao inicializar scanner:', error);
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      setIsScanning(false);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [scanMode, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#de4838]" />
            <h3 className="font-semibold text-gray-800">
              {scanMode === 'qrcode' ? 'Ler QR Code' : 'Ler Código de Barras'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div 
                id="qr-reader" 
                ref={scannerRef} 
                className="w-full rounded-lg overflow-hidden bg-gray-900"
                style={{ minHeight: '250px' }}
              />
              <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
                <p>
                  {scanMode === 'qrcode'
                    ? '📱 Posicione o QR Code no centro da tela'
                    : '📱 Posicione o código de barras no centro da tela'
                  }
                </p>
                <p className="text-gray-400">
                  {scanMode === 'qrcode'
                    ? 'Aponte para o QR Code da NFC-e'
                    : 'Aponte para o código de barras da NF-e'
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}