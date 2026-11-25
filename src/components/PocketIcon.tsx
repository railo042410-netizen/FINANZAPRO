import {
  Car,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Plane,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { PocketIconKey } from '../types/finance';

interface PocketIconProps {
  icon: PocketIconKey;
  className?: string;
}

export function PocketIcon({ icon, className = 'w-5 h-5' }: PocketIconProps) {
  switch (icon) {
    case 'shield':
      return <Shield className={className} />;
    case 'plane':
      return <Plane className={className} />;
    case 'trending':
      return <TrendingUp className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'laptop':
      return <Laptop className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'car':
      return <Car className={className} />;
    default:
      return <Shield className={className} />;
  }
}

export const POCKET_ICON_OPTIONS: { key: PocketIconKey; label: string }[] = [
  { key: 'shield', label: 'Emergencia' },
  { key: 'trending', label: 'Inversión' },
  { key: 'plane', label: 'Viaje' },
  { key: 'home', label: 'Vivienda' },
  { key: 'laptop', label: 'Tecnología' },
  { key: 'car', label: 'Vehículo' },
  { key: 'graduation', label: 'Educación' },
  { key: 'heart', label: 'Salud' },
];
