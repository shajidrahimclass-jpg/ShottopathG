import QRCodeLib from 'react-qr-code';

interface QRCodeWrapperProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export function QRCodeWrapper({ value, size = 128, bgColor = '#FFFFFF', fgColor = '#000000', level = 'L' }: QRCodeWrapperProps) {
  if (!value) {
    return null;
  }
  
  return (
    <QRCodeLib
      value={value}
      size={size}
      bgColor={bgColor}
      fgColor={fgColor}
      level={level}
    />
  );
}
