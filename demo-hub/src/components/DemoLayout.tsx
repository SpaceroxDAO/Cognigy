import React, { ReactNode } from 'react';

interface DemoLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  features?: string[];
  gradient?: string;
  icon?: ReactNode;
  onLogout?: () => void;
  children: ReactNode;
}

const DemoLayout = ({ children }: DemoLayoutProps) => {
  return <>{children}</>;
};

export default DemoLayout;
