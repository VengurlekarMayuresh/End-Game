import React from 'react';
import { Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 text-muted-foreground">
        <Construction size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-3">{title}</h1>
      <p className="text-muted-foreground max-w-md">
        This section is currently under development as part of the Module 2 rollout. Check back soon!
      </p>
    </div>
  );
};

export default Placeholder;
