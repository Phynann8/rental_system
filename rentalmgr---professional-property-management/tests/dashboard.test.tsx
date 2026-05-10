import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardLive from '../pages/DashboardLive';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../utils/LanguageContext';
import { CurrencyProvider } from '../utils/CurrencyContext';

describe('Dashboard Component Integration', () => {
  it('renders dashboard metrics successfully after fetching from MSW API mock', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <CurrencyProvider>
            <DashboardLive />
          </CurrencyProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    // Wait for the mock API response to populate the UI.
    // The metric '80.0%' is the occupancy rate in our mock handler.
    await waitFor(() => {
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });

    // Active tenants is 15
    expect(screen.getByText('15')).toBeInTheDocument();
    // Total rooms is 10, rendered as "9 / 10" in the building card
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });
});
