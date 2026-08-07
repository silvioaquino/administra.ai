// components/camera-scanner.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, AlertCircle, Upload, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'sonner';

interface CameraScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  scanMode?: 'qrcode' | 'barcode' | 'image';
  onImageProcess?: (data: any) => void;
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
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
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
    setProcessingProgress(0);
    setProcessingStage('Preparando imagem...');
    setError(null);

    try {
      // Simular progresso
      setProcessingProgress(10);
      setProcessingStage('Otimizando imagem para processamento...');
      
      // Pequeno delay para mostrar o progresso
      await new Promise(resolve => setTimeout(resolve, 300));

      // Converter base64 para File
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const file = new File([blob], 'nota-fiscal.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('imagem', file);

      setProcessingProgress(30);
      setProcessingStage('Enviando para análise...');
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const res = await fetch('/api/nfe/processar-imagem', {
        method: 'POST',
        body: formData
      });

      setProcessingProgress(60);
      setProcessingStage('Extraindo dados da nota fiscal...');
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const data = await res.json();

      if (data.success) {
        setProcessingProgress(100);
        setProcessingStage('✅ Nota fiscal processada com sucesso!');
        
        // Pequeno delay para mostrar o sucesso
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (onImageProcess) {
          onImageProcess(data.data);
        } else {
          onScan(JSON.stringify(data.data));
        }
        
        toast.success('Nota fiscal processada com sucesso!');
        onClose();
      } else {
        // Mostrar erro específico
        let errorMsg = data.error || 'Erro ao processar imagem';
        
        if (errorMsg.toLowerCase().includes('nítida') || errorMsg.toLowerCase().includes('nitida')) {
          errorMsg = '📸 A foto não está nítida o suficiente. Tire uma nova foto com melhor iluminação e foco.';
        } else if (errorMsg.toLowerCase().includes('produtos') || errorMsg.toLowerCase().includes('itens')) {
          errorMsg = '📋 Não foi possível identificar os produtos. Certifique-se de que a lista de produtos está visível na foto.';
        } else if (errorMsg.toLowerCase().includes('emitente')) {
          errorMsg = '🏢 Não foi possível identificar o emitente. Certifique-se de que o nome do estabelecimento está visível.';
        } else if (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('api_key')) {
          errorMsg = '🔑 Erro de configuração. Contate o administrador do sistema.';
        } else if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('limit')) {
          errorMsg = '⏳ Limite de uso do serviço atingido. Tente novamente em alguns minutos.';
        }
        
        setError(errorMsg);
        toast.error('Falha ao processar', { description: errorMsg });
        setProcessingProgress(0);
        setProcessingStage('');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      const errorMsg = 'Erro ao processar a imagem. Tente novamente com uma foto mais nítida e bem iluminada.';
      setError(errorMsg);
      toast.error('Falha ao processar', { description: errorMsg });
      setProcessingProgress(0);
      setProcessingStage('');
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

    // Validar tamanho mínimo (muito pequena = baixa qualidade)
    if (file.size < 50 * 1024) {
      toast.error('Imagem muito pequena. Tire uma foto com melhor qualidade.');
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

  // Função para abrir a câmera do dispositivo
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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

        // Determinar formatos suportados antes de criar o scanner
        let formats: any = undefined;
        let configs: any = {
          qrbox: { width: 350, height: 350 },
        };

        if (scanMode === 'barcode') {
          configs = {
            qrbox: { width: 400, height: 120 },
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

        const html5QrCode = new Html5Qrcode('qr-reader', {
          useBarCodeDetectorIfSupported: true,
          formatsToSupport: formats || [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

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
          // Silencioso - erros de leitura são normais
          // console.debug('Scan error:', errorMessage);
        };

        console.log('🚀 Iniciando scanner...');
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: configs.qrbox,
            disableFlip: true,
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
            },
          },
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
        <div className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
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

          {/* Body */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Dicas para melhor foto */}
            {!preview && !processingImage && !error && (
              <div className="bg-info/5 rounded-lg p-4 border border-info/20 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-info">💡 Dicas para melhor resultado:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 mt-1.5">
                      <li>• 📸 Tire a foto com boa iluminação</li>
                      <li>• 📋 Garanta que toda a nota fiscal está visível</li>
                      <li>• 🔍 Evite reflexos e sombras sobre o documento</li>
                      <li>• 📱 Mantenha a câmera estável e paralela ao documento</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-destructive/10 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive font-medium">{error}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setError(null);
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Processando */}
            {processingImage && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{processingStage || 'Processando...'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {processingProgress < 100 ? 'Aguarde, isso pode levar alguns segundos...' : 'Finalizando...'}
                  </p>
                </div>
                <div className="w-full max-w-xs bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground/70">
                  {processingProgress < 30 && '📸 Analisando a imagem...'}
                  {processingProgress >= 30 && processingProgress < 60 && '🔍 Extraindo informações...'}
                  {processingProgress >= 60 && processingProgress < 100 && '📋 Processando dados...'}
                  {processingProgress >= 100 && '✅ Concluído!'}
                </p>
              </div>
            )}

            {/* Preview da imagem */}
            {preview && !processingImage && !error && (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview da nota fiscal" 
                    className="max-h-80 mx-auto rounded-lg object-contain border border-border"
                  />
                  {!processingImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreview(null);
                        setError(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {!preview && !processingImage && !error && (
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
                  onClick={handleTakePhoto}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tirar foto agora
                </Button>
              </>
            )}

            {/* Footer com instruções */}
            {!error && !processingImage && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  A imagem será processada pelo Gemini AI para extrair os dados da nota fiscal
                </p>
              </div>
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
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground/70">
                    💡 Se o QR Code estiver ilegível, use a opção "Tirar Foto" na página anterior
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}