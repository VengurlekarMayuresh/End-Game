import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">AdminLayout</h1>
      <Outlet />
    </div>
  );
};

export default AdminLayout;
