import React from 'react';
import { Outlet } from 'react-router-dom';

const RecruiterLayout = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">RecruiterLayout</h1>
      <Outlet />
    </div>
  );
};

export default RecruiterLayout;
