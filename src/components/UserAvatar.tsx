import React from 'react';

interface Props {
  name: string;
  avatarColor?: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<Props> = ({
  name,
  avatarColor = '#10B981',
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base font-black',
  };

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-xl object-cover border border-zinc-700/80 shadow shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center font-bold text-white shadow shrink-0 ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      {initial}
    </div>
  );
};
