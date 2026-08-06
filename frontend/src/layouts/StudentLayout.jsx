import React from 'react';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">StudentLayout</h1>
      <Outlet />
    </div>
  );
};

export default StudentLayout;
