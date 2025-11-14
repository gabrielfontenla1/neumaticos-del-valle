'use client';

import { useState } from 'react';
import TicketForm from './TicketForm';
import TicketPreview from './TicketPreview';
import { TicketData } from './types';

export default function TicketGeneratorApp() {
  const [ticketData, setTicketData] = useState<TicketData>({
    business: {
      tradeName: 'HIPER LIBERTAD',
      legalName: 'LIBERTAD S.A.',
      cuit: '30-61292994-5',
      addressFiscal: 'Fray Luis Beltrán y M. Cardoñosa',
      addressCommercial: 'Fray Luis Beltrán y M. Cardoñosa',
      taxId: '904-231046-2',
      taxCondition: 'RI',
      activityStartDate: '1995-06-29',
      iibbAgent: '30001040406',
    },
    voucher: {
      type: 'B',
      typeCode: '006',
      pointOfSale: 54,
      number: 113099,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-AR', { hour12: false }),
    },
    items: [],
    amounts: {
      subtotal: 0,
      discounts: 0,
      subtotalAfterDiscounts: 0,
      taxIVA: 0,
      taxOthers: 0,
      taxInternal: 0,
      total: 0,
    },
    promotions: [],
    payment: {
      methods: [],
    },
    metadata: {
      cashier: '554',
      cashRegister: 'SCO054',
      sequence: 35,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Generador de Tickets Fiscales
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Herramienta interna - Uso restringido
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <TicketForm
              ticketData={ticketData}
              onChange={setTicketData}
            />
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 self-start">
            <TicketPreview ticketData={ticketData} />
          </div>
        </div>
      </div>
    </div>
  );
}
