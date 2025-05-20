
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';

type SeverityType = 'critical' | 'serious' | 'moderate' | 'minor' | 'info' | 'pass';

interface IssueSeverityBadgeProps {
  severity: SeverityType;
}

const IssueSeverityBadge = ({ severity }: IssueSeverityBadgeProps) => {
  const getConfig = () => {
    switch (severity) {
      case 'critical':
        return { 
          label: 'Critical', 
          variant: 'destructive',
          icon: <AlertCircle className="h-3 w-3 mr-1" /> 
        };
      case 'serious':
        return { 
          label: 'Serious', 
          className: 'bg-serious text-white hover:bg-serious/80',
          icon: <AlertTriangle className="h-3 w-3 mr-1" /> 
        };
      case 'moderate':
        return { 
          label: 'Moderate', 
          className: 'bg-moderate text-foreground hover:bg-moderate/80',
          icon: <AlertTriangle className="h-3 w-3 mr-1" /> 
        };
      case 'minor':
        return { 
          label: 'Minor', 
          className: 'bg-minor text-white hover:bg-minor/80',
          icon: <Info className="h-3 w-3 mr-1" />  
        };
      case 'info':
        return { 
          label: 'Info', 
          className: 'bg-info text-white hover:bg-info/80',
          icon: <Info className="h-3 w-3 mr-1" /> 
        };
      case 'pass':
        return { 
          label: 'Pass', 
          className: 'bg-pass text-white hover:bg-pass/80',
          icon: <Check className="h-3 w-3 mr-1" /> 
        };
      default:
        return { 
          label: 'Unknown', 
          variant: 'outline',
          icon: <Info className="h-3 w-3 mr-1" /> 
        };
    }
  };

  const { label, variant, className, icon } = getConfig();

  return (
    <Badge variant={variant as any} className={className}>
      <span className="flex items-center">
        {icon}
        {label}
      </span>
    </Badge>
  );
};

export default IssueSeverityBadge;
