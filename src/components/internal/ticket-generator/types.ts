export interface TicketData {
  business: {
    tradeName: string; // HIPER LIBERTAD
    legalName: string; // LIBERTAD S.A.
    cuit: string;
    addressFiscal: string;
    addressCommercial: string;
    taxId: string; // Ingresos Brutos
    taxCondition: 'RI' | 'MT' | 'EX' | 'CF';
    activityStartDate: string;
    iibbAgent: string;
  };
  voucher: {
    type: 'A' | 'B' | 'C' | 'X';
    typeCode: string; // '006' para Factura B
    pointOfSale: number;
    number: number;
    date: string;
    time: string;
    cae?: string; // CAE de AFIP
    caeExpiration?: string; // Fecha vencimiento CAE
    electronicReference?: string; // Referencia electrónica
  };
  items: TicketItem[];
  amounts: {
    subtotal: number;
    discounts: number;
    subtotalAfterDiscounts: number;
    taxIVA: number;
    taxOthers: number;
    taxInternal: number; // Impuestos internos
    total: number;
  };
  promotions: Promotion[];
  payment: {
    methods: PaymentMethod[];
    totalSavings?: number; // Total ahorro
  };
  customer?: {
    name: string;
    sequence?: number;
    totalArticles?: number;
  };
  metadata: {
    cashier: string; // Cajero (ej: 554)
    cashRegister: string; // Caja (ej: SCO054)
    sequence: number; // Número de secuencia (ej: 35)
    operationCode?: string; // Código operación (ej: 0035 0102/054/554)
    timestamp?: string; // Timestamp completo
  };
}

export interface TicketItem {
  id: string;
  quantity: number;
  code?: string;
  description: string;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discount: number;
}

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'mp' | 'transfer' | 'other';
  amount: number;
  details?: string;
}
