// components/camera-scanner.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const isProcessingRef = useRef(false); // Usar ref ao invés de state
  const isMountedRef = useRef(true);

  // Função para parar o scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignora erros ao parar
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!scannerRef.current) {
      setError('Elemento não encontrado');
      return;
    }

    const initScanner = async () => {
      try {
        // Limpa qualquer scanner anterior
        await stopScanner();
        html5QrCodeRef.current = null;

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        // Configuração para QR Code
        let configs: any = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Configuração para código de barras
        let formats: any = undefined;
        if (scanMode === 'barcode') {
          configs = {
            fps: 15,
            qrbox: { width: 320, height: 100 },
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

        // Callback de sucesso - USANDO REF para evitar problemas de closure
        const onScanSuccess = (decodedText: string) => {
          console.log('📸 QR Code detectado:', decodedText);
          
          // Verifica se já está processando ou se o componente foi desmontado
          if (isProcessingRef.current || !isMountedRef.current) {
            console.log('⏭️ Ignorando - já processando ou desmontado');
            return;
          }

          // Marca como processando para evitar múltiplas leituras
          isProcessingRef.current = true;

          // Para o scanner imediatamente
          stopScanner();

          // Chama o callback com o resultado
          console.log('✅ Enviando resultado para o callback');
          onScan(decodedText);
        };

        const onScanError = (errorMessage: string) => {
          // Silencioso - erros de leitura são normais
          // console.debug('Scan error:', errorMessage);
        };

        console.log('🚀 Iniciando scanner...');
        
        // Inicia o scanner
        await html5QrCode.start(
          { facingMode: "environment" },
          formats ? { fps: 15, qrbox: configs.qrbox } : configs,
          onScanSuccess,
          onScanError
        );

        console.log('✅ Scanner iniciado com sucesso');
        setError(null);

      } catch (error) {
        console.error('❌ Erro ao inicializar scanner:', error);
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    };

    initScanner();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      isProcessingRef.current = false;
      stopScanner();
    };
  }, [scanMode, onScan]); // Removido stopScanner para evitar loop infinito

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
            onClick={() => {
              isProcessingRef.current = false;
              onClose();
            }}
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