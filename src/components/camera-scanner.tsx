// components/camera-scanner.tsx (versão corrigida e melhorada)
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
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
  const isProcessingRef = useRef(false);

  const stopScanner = useCallback(() => {
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
  }, []);

  useEffect(() => {
    // Verifica se o elemento de vídeo existe
    if (!videoRef.current) {
      setError('Elemento de vídeo não encontrado');
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        // Configuração de hints para melhor precisão
        const hints = new Map();
        
        if (scanMode === 'qrcode') {
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        } else {
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

        const videoElement = videoRef.current;
        if (!videoElement) {
          throw new Error('Elemento de vídeo não disponível');
        }

        // Inicia a leitura usando constraints para a câmera traseira
        await reader.decodeFromConstraints(
          { facingMode: "environment" } as MediaStreamConstraints,
          videoElement,
          (result: any, error: any) => {
            // Se já está processando ou não está escaneando, ignora
            if (isProcessingRef.current || !isScanning) {
              return;
            }

            if (result) {
              const decodedText = result.getText();
              console.log('📸 QR Code lido:', decodedText);
              
              isProcessingRef.current = true;
              setIsScanning(false);
              
              // Limpa timeout anterior
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              // Delay para evitar múltiplas leituras
              timeoutRef.current = setTimeout(() => {
                // Para o scanner antes de chamar o callback
                stopScanner();
                // Chama o callback com o resultado
                onScan(decodedText);
              }, 300);
            }
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
      isProcessingRef.current = false;
    };
  }, [onScan, scanMode, stopScanner, isScanning]);

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
                
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`
                      relative border-2 border-white/50 rounded-lg
                      ${scanMode === 'qrcode' ? 'w-48 h-48' : 'w-64 h-20'}
                    `}>
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#de4838]" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#de4838]" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#de4838]" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#de4838]" />
                    </div>
                  </div>
                </div>

                {/* Indicador de leitura */}
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-medium text-gray-700">
                      ✅ Lendo...
                    </div>
                  </div>
                )}
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