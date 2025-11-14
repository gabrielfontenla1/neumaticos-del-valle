'use client';

import { useState } from 'react';
import { TicketData, TicketItem, Promotion, PaymentMethod } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Save } from 'lucide-react';
import { generatePDF } from './pdfGenerator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Props {
  ticketData: TicketData;
  onChange: (data: TicketData) => void;
}

export default function TicketForm({ ticketData, onChange }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to update nested business data
  const updateBusiness = (updates: Partial<typeof ticketData.business>) => {
    onChange({
      ...ticketData,
      business: { ...ticketData.business, ...updates },
    });
  };

  // Helper to update nested voucher data
  const updateVoucher = (updates: Partial<typeof ticketData.voucher>) => {
    onChange({
      ...ticketData,
      voucher: { ...ticketData.voucher, ...updates },
    });
  };

  // Helper to update metadata
  const updateMetadata = (updates: Partial<typeof ticketData.metadata>) => {
    onChange({
      ...ticketData,
      metadata: { ...ticketData.metadata, ...updates },
    });
  };

  // Helper to update customer
  const updateCustomer = (updates: Partial<typeof ticketData.customer>) => {
    onChange({
      ...ticketData,
      customer: { ...ticketData.customer, ...updates } as any,
    });
  };

  // Add item
  const addItem = () => {
    const newItem: TicketItem = {
      id: Date.now().toString(),
      quantity: 1,
      description: '',
      unitPrice: 0,
      subtotal: 0,
      taxRate: 21,
    };

    onChange({
      ...ticketData,
      items: [...ticketData.items, newItem],
    });
  };

  // Update item
  const updateItem = (id: string, updates: Partial<TicketItem>) => {
    const items = ticketData.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.subtotal = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });

    recalculateTotals({ ...ticketData, items });
  };

  // Remove item
  const removeItem = (id: string) => {
    const items = ticketData.items.filter((item) => item.id !== id);
    recalculateTotals({ ...ticketData, items });
  };

  // Add promotion
  const addPromotion = () => {
    const newPromo: Promotion = {
      id: Date.now().toString(),
      code: '',
      description: '',
      discount: 0,
    };

    onChange({
      ...ticketData,
      promotions: [...ticketData.promotions, newPromo],
    });
  };

  // Update promotion
  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    const promotions = ticketData.promotions.map((promo) =>
      promo.id === id ? { ...promo, ...updates } : promo
    );
    recalculateTotals({ ...ticketData, promotions });
  };

  // Remove promotion
  const removePromotion = (id: string) => {
    const promotions = ticketData.promotions.filter((promo) => promo.id !== id);
    recalculateTotals({ ...ticketData, promotions });
  };

  // Add payment method
  const addPaymentMethod = () => {
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      type: 'cash',
      amount: 0,
    };

    onChange({
      ...ticketData,
      payment: {
        methods: [...ticketData.payment.methods, newPayment],
      },
    });
  };

  // Update payment method
  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    const methods = ticketData.payment.methods.map((method) =>
      method.id === id ? { ...method, ...updates } : method
    );

    onChange({
      ...ticketData,
      payment: { ...ticketData.payment, methods },
    });
  };

  // Remove payment method
  const removePaymentMethod = (id: string) => {
    const methods = ticketData.payment.methods.filter((method) => method.id !== id);
    onChange({
      ...ticketData,
      payment: { ...ticketData.payment, methods },
    });
  };

  // Recalculate totals
  const recalculateTotals = (data: TicketData) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discounts = data.promotions.reduce((sum, promo) => sum + promo.discount, 0);
    const subtotalAfterDiscounts = subtotal - discounts;
    const taxIVA = subtotalAfterDiscounts * 0.21; // 21% IVA
    const total = subtotalAfterDiscounts + taxIVA;

    // Calculate total savings
    const totalPayments = data.payment.methods.reduce((sum, m) => sum + m.amount, 0);
    const totalSavings = discounts;

    onChange({
      ...data,
      amounts: {
        subtotal,
        discounts,
        subtotalAfterDiscounts,
        taxIVA,
        taxOthers: 0,
        taxInternal: 0,
        total,
      },
      payment: {
        ...data.payment,
        totalSavings,
      },
    });
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(ticketData);
      // Auto increment number
      updateVoucher({ number: ticketData.voucher.number + 1 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save configuration to localStorage
  const saveConfig = () => {
    localStorage.setItem('ticketConfig', JSON.stringify(ticketData.business));
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Configuración del Ticket</h2>
        <Button onClick={saveConfig} size="sm" variant="outline">
          <Save className="w-4 h-4 mr-1" />
          Guardar Config
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['voucher', 'items']} className="w-full">
        {/* Business Configuration */}
        <AccordionItem value="business">
          <AccordionTrigger>Datos del Negocio</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label>Nombre Comercial (Encabezado)</Label>
              <Input
                value={ticketData.business.tradeName}
                onChange={(e) => updateBusiness({ tradeName: e.target.value })}
                placeholder="HIPER LIBERTAD"
              />
            </div>

            <div>
              <Label>Razón Social</Label>
              <Input
                value={ticketData.business.legalName}
                onChange={(e) => updateBusiness({ legalName: e.target.value })}
                placeholder="LIBERTAD S.A."
              />
            </div>

            <div>
              <Label>CUIT</Label>
              <Input
                value={ticketData.business.cuit}
                onChange={(e) => updateBusiness({ cuit: e.target.value })}
                placeholder="30-61292994-5"
              />
            </div>

            <div>
              <Label>Domicilio Comercial</Label>
              <Input
                value={ticketData.business.addressCommercial}
                onChange={(e) => updateBusiness({ addressCommercial: e.target.value })}
              />
            </div>

            <div>
              <Label>Domicilio Fiscal</Label>
              <Input
                value={ticketData.business.addressFiscal}
                onChange={(e) => updateBusiness({ addressFiscal: e.target.value })}
              />
            </div>

            <div>
              <Label>Ingresos Brutos</Label>
              <Input
                value={ticketData.business.taxId}
                onChange={(e) => updateBusiness({ taxId: e.target.value })}
                placeholder="904-231046-2"
              />
            </div>

            <div>
              <Label>Condición IVA</Label>
              <Select
                value={ticketData.business.taxCondition}
                onValueChange={(value: any) => updateBusiness({ taxCondition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RI">Responsable Inscripto</SelectItem>
                  <SelectItem value="MT">Monotributo</SelectItem>
                  <SelectItem value="EX">Exento</SelectItem>
                  <SelectItem value="CF">Consumidor Final</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha Inicio Actividades</Label>
              <Input
                type="date"
                value={ticketData.business.activityStartDate}
                onChange={(e) => updateBusiness({ activityStartDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Agente IIBB</Label>
              <Input
                value={ticketData.business.iibbAgent}
                onChange={(e) => updateBusiness({ iibbAgent: e.target.value })}
                placeholder="30001040406"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Voucher Info */}
        <AccordionItem value="voucher">
          <AccordionTrigger>Datos del Comprobante</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Factura</Label>
                <Select
                  value={ticketData.voucher.type}
                  onValueChange={(value: any) => updateVoucher({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Factura A</SelectItem>
                    <SelectItem value="B">Factura B</SelectItem>
                    <SelectItem value="C">Factura C</SelectItem>
                    <SelectItem value="X">Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Código Tipo (Cod.)</Label>
                <Input
                  value={ticketData.voucher.typeCode}
                  onChange={(e) => updateVoucher({ typeCode: e.target.value })}
                  placeholder="006"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Punto de Venta</Label>
                <Input
                  type="number"
                  value={ticketData.voucher.pointOfSale}
                  onChange={(e) => updateVoucher({ pointOfSale: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Número de Comprobante</Label>
                <Input
                  type="number"
                  value={ticketData.voucher.number}
                  onChange={(e) => updateVoucher({ number: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={ticketData.voucher.date}
                  onChange={(e) => updateVoucher({ date: e.target.value })}
                />
              </div>

              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={ticketData.voucher.time}
                  onChange={(e) => updateVoucher({ time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>CAE (Código Autorización Electrónico)</Label>
              <Input
                value={ticketData.voucher.cae || ''}
                onChange={(e) => updateVoucher({ cae: e.target.value })}
                placeholder="75349203331194"
                maxLength={14}
              />
            </div>

            <div>
              <Label>Fecha Vencimiento CAE</Label>
              <Input
                type="date"
                value={ticketData.voucher.caeExpiration || ''}
                onChange={(e) => updateVoucher({ caeExpiration: e.target.value })}
              />
            </div>

            <div>
              <Label>Referencia Electrónica (opcional)</Label>
              <Input
                value={ticketData.voucher.electronicReference || ''}
                onChange={(e) => updateVoucher({ electronicReference: e.target.value })}
                placeholder="CAE 75349203331194"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Items */}
        <AccordionItem value="items">
          <AccordionTrigger>Items / Productos</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {ticketData.items.length} {ticketData.items.length === 1 ? 'item' : 'items'}
              </p>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </Button>
            </div>

            <div className="space-y-3">
              {ticketData.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Código (opcional)</Label>
                      <Input
                        value={item.code || ''}
                        onChange={(e) => updateItem(item.id, { code: e.target.value })}
                        placeholder="467909"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      rows={2}
                      placeholder="CER-CORONA710(21.00X)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Precio Unitario</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Subtotal</Label>
                      <Input value={`$ ${item.subtotal.toFixed(2)}`} readOnly />
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ))}

              {ticketData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay items agregados. Click en "Agregar Item" para comenzar.
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Promotions */}
        <AccordionItem value="promotions">
          <AccordionTrigger>Promociones y Descuentos</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {ticketData.promotions.length} promociones aplicadas
              </p>
              <Button onClick={addPromotion} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Promoción
              </Button>
            </div>

            <div className="space-y-3">
              {ticketData.promotions.map((promo) => (
                <div key={promo.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label>Código Promoción</Label>
                    <Input
                      value={promo.code}
                      onChange={(e) => updatePromotion(promo.id, { code: e.target.value })}
                      placeholder="OI 25% ALMACEN G1"
                    />
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Input
                      value={promo.description}
                      onChange={(e) => updatePromotion(promo.id, { description: e.target.value })}
                      placeholder="Oferta especial"
                    />
                  </div>

                  <div>
                    <Label>Monto Descuento</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promo.discount}
                      onChange={(e) =>
                        updatePromotion(promo.id, { discount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePromotion(promo.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payment Methods */}
        <AccordionItem value="payment">
          <AccordionTrigger>Medios de Pago</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {ticketData.payment.methods.length} medios de pago
              </p>
              <Button onClick={addPaymentMethod} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Pago
              </Button>
            </div>

            <div className="space-y-3">
              {ticketData.payment.methods.map((method) => (
                <div key={method.id} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo de Pago</Label>
                      <Select
                        value={method.type}
                        onValueChange={(value: any) =>
                          updatePaymentMethod(method.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="mp">Billetera MP</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={method.amount}
                        onChange={(e) =>
                          updatePaymentMethod(method.id, { amount: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Detalles (opcional)</Label>
                    <Input
                      value={method.details || ''}
                      onChange={(e) => updatePaymentMethod(method.id, { details: e.target.value })}
                      placeholder="Información adicional"
                    />
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePaymentMethod(method.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            {ticketData.payment.methods.length > 0 && (
              <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Suma de pagos:</span>
                  <span className="font-medium">
                    ${ticketData.payment.methods.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total del ticket:</span>
                  <span className="font-medium">${ticketData.amounts.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span>Diferencia:</span>
                  <span className={`font-bold ${
                    Math.abs(ticketData.payment.methods.reduce((sum, m) => sum + m.amount, 0) - ticketData.amounts.total) < 0.01
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    ${(
                      ticketData.payment.methods.reduce((sum, m) => sum + m.amount, 0) -
                      ticketData.amounts.total
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Customer */}
        <AccordionItem value="customer">
          <AccordionTrigger>Datos del Cliente (Opcional)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label>Nombre del Cliente</Label>
              <Input
                value={ticketData.customer?.name || ''}
                onChange={(e) => updateCustomer({ name: e.target.value })}
                placeholder="JUAN IBAÑEZ"
              />
            </div>

            <div>
              <Label>Número de Secuencia</Label>
              <Input
                type="number"
                value={ticketData.customer?.sequence || ''}
                onChange={(e) =>
                  updateCustomer({ sequence: parseInt(e.target.value) || undefined })
                }
                placeholder="35"
              />
            </div>

            <div>
              <Label>Total Artículos</Label>
              <Input
                type="number"
                value={ticketData.customer?.totalArticles || ticketData.items.length}
                onChange={(e) =>
                  updateCustomer({ totalArticles: parseInt(e.target.value) || undefined })
                }
                placeholder="Calculado automáticamente"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Metadata */}
        <AccordionItem value="metadata">
          <AccordionTrigger>Datos Adicionales (Cajero, Caja)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label>Cajero</Label>
              <Input
                value={ticketData.metadata.cashier}
                onChange={(e) => updateMetadata({ cashier: e.target.value })}
                placeholder="554"
              />
            </div>

            <div>
              <Label>Caja / Registro</Label>
              <Input
                value={ticketData.metadata.cashRegister}
                onChange={(e) => updateMetadata({ cashRegister: e.target.value })}
                placeholder="SCO054"
              />
            </div>

            <div>
              <Label>Número de Secuencia (Caja)</Label>
              <Input
                type="number"
                value={ticketData.metadata.sequence}
                onChange={(e) => updateMetadata({ sequence: parseInt(e.target.value) || 0 })}
                placeholder="35"
              />
            </div>

            <div>
              <Label>Código de Operación (opcional)</Label>
              <Input
                value={ticketData.metadata.operationCode || ''}
                onChange={(e) => updateMetadata({ operationCode: e.target.value })}
                placeholder="0035 0102/054/554"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Generate Button */}
      <div className="pt-4 border-t space-y-4">
        {/* Validation Messages */}
        {ticketData.items.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm">
            ⚠️ Debes agregar al menos 1 item para generar el ticket
          </div>
        )}

        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating || ticketData.items.length === 0}
          className="w-full"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
        </Button>
      </div>
    </div>
  );
}
