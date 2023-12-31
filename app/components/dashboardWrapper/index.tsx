'use client'

import React from 'react';

import { SDMXDashboard } from 'sdmx-dashboard-react';

const DashboardWrapper = (props:
  { uri: string, className?: string }
) => {
  return (
    <div className={props.className}>
      <SDMXDashboard dashUrl={props.uri} />
    </div>
  );
}

export default DashboardWrapper;