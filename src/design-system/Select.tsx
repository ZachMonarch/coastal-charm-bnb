import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  children?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ label, children, id, onChange, ...rest }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <select 
        id={id} 
        onChange={(e) => onChange?.(e.target.value)}
        {...rest} 
        className="block w-full rounded-md border px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
