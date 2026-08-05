// components/camera-scanner.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, AlertCircle, Upload, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'sonner';

interface CameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  scanMode?: 'qrcode' | 'barcode' | 'image';
  onImageProcess?: (data: any) => void; // Callback específico para imagem processada
}

export function CameraScanner({ 
  onScan, 
  onClose, 
  scanMode = 'qrcode',
  onImageProcess 
}: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const isProcessingRef = useRef(false);
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

  // Função para processar imagem com Gemini
  const processImageWithGemini = async (imageBase64: string) => {
    setProcessingImage(true);
    setError(null);

    try {
      // Converter base64 para File
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const file = new File([blob], 'nota-fiscal.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('imagem', file);

      const res = await fetch('/api/nfe/processar-imagem', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        // Se tiver callback específico, usa ele
        if (onImageProcess) {
          onImageProcess(data.data);
        } else {
          // Senão, passa como string JSON
          onScan(JSON.stringify(data.data));
        }
        toast.success('Nota fiscal processada com sucesso!');
        onClose();
      } else {
        setError(data.error || 'Erro ao processar imagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setProcessingImage(false);
    }
  };

  // Função para lidar com upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!tiposPermitidos.includes(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG, WEBP ou HEIC.');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      // Processar automaticamente
      processImageWithGemini(result);
    };
    reader.readAsDataURL(file);
  };

  // Inicializar scanner para QR Code/Barcode
  useEffect(() => {
    // Se for modo imagem, não inicializa o scanner
    if (scanMode === 'image') {
      return;
    }

    isMountedRef.current = true;

    if (!scannerRef.current) {
      setError('Elemento não encontrado');
      return;
    }

    const initScanner = async () => {
      try {
        await stopScanner();
        html5QrCodeRef.current = null;

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        let configs: any = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

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

        const onScanSuccess = (decodedText: string) => {
          console.log('📸 QR Code detectado:', decodedText);
          
          if (isProcessingRef.current || !isMountedRef.current) {
            console.log('⏭️ Ignorando - já processando ou desmontado');
            return;
          }

          isProcessingRef.current = true;
          stopScanner();
          onScan(decodedText);
        };

        const onScanError = (errorMessage: string) => {
          // Silencioso
        };

        console.log('🚀 Iniciando scanner...');
        
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

    return () => {
      isMountedRef.current = false;
      isProcessingRef.current = false;
      stopScanner();
    };
  }, [scanMode, onScan, stopScanner]);

  // Renderização para modo imagem
  if (scanMode === 'image') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Foto da Nota Fiscal
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                isProcessingRef.current = false;
                onClose();
              }}
              className="rounded-full hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-destructive/10 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setError(null)}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {processingImage ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Processando nota fiscal...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Isso pode levar alguns segundos</p>
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <img 
                  src={preview} 
                  alt="Preview da nota fiscal" 
                  className="max-h-96 mx-auto rounded-lg object-contain"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex-1"
                  >
                    Nova foto
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Tire uma foto clara e bem iluminada da nota fiscal</p>
                  <p className="text-xs mt-1">Aceita: JPG, PNG, WEBP (máx. 10MB)</p>
                </div>

                <div 
                  className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground/70" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar uma foto
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      ou tire uma foto com seu celular
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    capture="environment"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    // Tentar usar a câmera diretamente (se suportado)
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tirar foto agora
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderização para QR Code/Barcode (original)
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
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
            className="rounded-full hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="bg-destructive/10 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
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
                className="w-full rounded-lg overflow-hidden bg-surface"
                style={{ minHeight: '250px' }}
              />
              <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
                <p>
                  {scanMode === 'qrcode'
                    ? '📱 Posicione o QR Code no centro da tela'
                    : '📱 Posicione o código de barras no centro da tela'
                  }
                </p>
                <p className="text-muted-foreground">
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