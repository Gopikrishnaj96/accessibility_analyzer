
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const PageContainer = ({ children, title, description }: PageContainerProps) => {
  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageContainer;
