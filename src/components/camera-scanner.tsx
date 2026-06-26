// components/camera-scanner.tsx (versão com @zxing)
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  scanMode?: 'qrcode' | 'barcode';
}

export function CameraScanner({ onScan, onClose, scanMode = 'qrcode' }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        // Configuração de hints para melhor precisão
        const hints = new Map();
        
        if (scanMode === 'qrcode') {
          // Forçar apenas QR Code
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        } else {
          // Para código de barras, permitir vários formatos
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.CODABAR,
            BarcodeFormat.ITF,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
          ]);
        }

        // Tempo de scan mais alto para melhor precisão
        await reader.decodeFromVideoDevice(
          undefined, // câmera padrão
          videoRef.current!,
          (result: Result | null, error: any) => {
            if (result && isScanning) {
              setIsScanning(false);
              
              // Debounce para evitar múltiplas leituras
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              timeoutRef.current = setTimeout(() => {
                onScan(result.getText());
                stopScanner();
              }, 300);
            }
            
            // Se houver erro de leitura, apenas ignorar (continuar tentando)
          }
        );
      } catch (err) {
        console.error('Erro ao iniciar scanner:', err);
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    };

    startScanner();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopScanner();
    };
  }, [onScan, scanMode]);

  const stopScanner = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch (e) {
        console.error('Erro ao resetar reader:', e);
      }
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

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
              stopScanner();
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
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full aspect-square object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Overlay com guia de escaneamento */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`
                      relative border-2 border-white/50 rounded-lg
                      ${scanMode === 'qrcode' ? 'w-48 h-48' : 'w-64 h-20'}
                    `}>
                      {/* Cantos decorativos */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#de4838]" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#de4838]" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#de4838]" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#de4838]" />
                    </div>
                  </div>
                </div>
              </div>

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