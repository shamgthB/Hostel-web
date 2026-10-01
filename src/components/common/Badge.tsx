import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', size = 'sm' }) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  if (['paid', 'resolved', 'active', 'available'].includes(normalized)) {
    return <Badge variant="green">{status}</Badge>;
  }
  if (['partial', 'in progress'].includes(normalized)) {
    return <Badge variant="amber">{status}</Badge>;
  }
  if (['pending', 'urgent', 'occupied', 'maintenance'].includes(normalized)) {
    return <Badge variant="red">{status}</Badge>;
  }
  if (['high'].includes(normalized)) {
    return <Badge variant="amber">{status}</Badge>;
  }
  if (['deluxe', 'single'].includes(normalized)) {
    return <Badge variant="purple">{status}</Badge>;
  }
  return <Badge variant="gray">{status}</Badge>;
};
