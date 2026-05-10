import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/dashboard', () => {
    return HttpResponse.json({
      totalBuildings: 2,
      totalRooms: 10,
      occupiedRooms: 8,
      occupancyRate: 80.0,
      activeTenants: 15,
      unpaidCount: 0,
      unpaidAmount: 0,
      projectedRevenue: 15000,
      collectedThisMonth: 12000,
      revenue: [
        { month: 'Jan', revenue: 12000 },
        { month: 'Feb', revenue: 13500 },
        { month: 'Mar', revenue: 15000 },
      ],
      activity: [
        { type: 'Payment', title: 'Payment Received', description: 'Payment of $500 received', at: new Date().toISOString() },
      ],
    });
  }),

  http.get('/api/ai/intelligence-data', () => {
    return HttpResponse.json({
      rooms: [
        { roomNumber: '101', building: 'Building A', type: 'Studio', currentPrice: 500, status: 'Occupied' },
      ],
      leases: [
        { tenant: 'John Doe', room: '101', endDate: '2026-12-31', price: 500 },
      ],
      revenue: [
        { year: 2026, month: 4, totalCollected: 12000 },
      ],
      utilities: [
        { room: '101', type: 'Electric', value: 100, date: '2026-04-12' },
      ],
    });
  }),

  http.get('/api/dashboard/buildings', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Building A',
        address: '123 Street',
        totalRooms: 10,
        occupiedRooms: 9,
        occupancyRate: 90,
        activeTenants: 9,
        collectedThisMonth: 5000,
        projectedRevenue: 5500,
        outstandingBalance: 500,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80'
      },
    ]);
  }),

  http.get('/api/settings', () => {
    return HttpResponse.json({
      id: 1,
      companyName: 'Test Corp',
      currencySymbol: '$',
      defaultInvoiceDueDays: 7,
      defaultElectricityRate: 1000,
      defaultWaterRate: 1500,
      exchangeRateUsdToKhr: 4100
    });
  }),
];
