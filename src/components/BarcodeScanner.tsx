import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Volume2, VolumeX, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BarcodeScannerProps {
  onBarcodeScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeScan, onClose }) => {
  const [manualInput, setManualInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initCamera = async () => {
      try {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia not supported');
        }

        // Set timeout for camera initialization (5 seconds)
        timeoutId = setTimeout(() => {
          if (isMounted && loadingCamera) {
            console.warn('Camera initialization timeout');
            setCameraError('Camera initialization timed out. Please use manual entry.');
            setLoadingCamera(false);
          }
        }, 5000);

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        clearTimeout(timeoutId);

        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setLoadingCamera(false);
        }
      } catch (err: any) {
        if (isMounted) {
          clearTimeout(timeoutId);
          console.error('Camera error:', err);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access to use the scanner.'
              : err.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : 'Unable to access camera. Please use manual entry instead.'
          );
          setLoadingCamera(false);
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadingCamera]);

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      onBarcodeScan(manualInput);
      setManualInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Barcode Scanner</h2>
              <p className="text-sm text-blue-100">Point camera at barcode or enter manually</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Camera View or Error */}
        {cameraError ? (
          <div className="h-80 bg-black flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-yellow-100 font-medium mb-2">{cameraError}</p>
              <p className="text-gray-400 text-sm">Use manual entry below to scan barcodes</p>
            </div>
          </div>
        ) : loadingCamera ? (
          <div className="h-80 bg-black flex items-center justify-center">
            <div className="text-center">
              <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Initializing camera...</p>
            </div>
          </div>
        ) : (
          <div className="relative bg-black h-80">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-48 border-2 border-blue-500 rounded-lg shadow-lg shadow-blue-500/50">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent rounded-lg" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 p-6 space-y-4 border-t border-gray-700">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Sound Feedback</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`${
                soundEnabled
                  ? 'bg-blue-600 border-blue-700 hover:bg-blue-700'
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Manual Entry */}
          <form onSubmit={handleManualEntry} className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Manual Barcode Entry
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter barcode manually..."
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                autoFocus
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                className="btn-premium px-6"
                disabled={!manualInput.trim()}
              >
                Submit
              </Button>
            </div>
            <p className="text-xs text-gray-400">Press Enter or click Submit to submit barcode</p>
          </form>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
          >
            Close Scanner
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 px-6 py-4 text-sm text-gray-400 border-t border-gray-700">
          <ul className="space-y-2">
            <li>✓ Position barcode within the frame (if camera available)</li>
            <li>✓ Or manually type the barcode and click Submit</li>
            <li>✓ Barcodes are case-sensitive</li>
          </ul>
        </div>
      </motion.div>

      {/* Beep Sound */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
    </div>
  );
};

export default BarcodeScanner;

