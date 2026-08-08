import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

const Logo = ({ href = '/', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[14px]',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSize = { sm: 16, md: 20, lg: 24 }[size];
  const iconWrapperSize = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' }[size];

  return (
    <Link to={href} className={`flex items-center gap-2 group shrink-0 ${className}`}>
      <div className={`bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform ${iconWrapperSize[size]}`}>
        <Briefcase size={iconSize} />
      </div>
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>HireSense AI</span>
    </Link>
  );
};

export default Logo;