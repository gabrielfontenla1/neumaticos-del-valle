'use client';

import { TicketData } from './types';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  ticketData: TicketData;
}

export default function TicketPreview({ ticketData }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL('https://www.hiperlibertad.com.ar', {
      width: 200,
      margin: 1,
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium">Vista Previa</h3>
        <div className="text-xs text-gray-500">Ancho: 80mm</div>
      </div>

      {/* Ticket Preview */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <div
          className="bg-white p-4 font-mono text-xs"
          style={{
            width: '302px', // 80mm @ 96dpi
            fontFamily: 'Courier New, monospace',
          }}
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            <div className="font-bold text-sm">{ticketData.business.tradeName}</div>
            <div className="text-[11px]">{ticketData.business.legalName}</div>
            <div className="text-[10px]">CUIT Nro: {ticketData.business.cuit}</div>
            <div className="text-[10px]">
              Dom.Com: {ticketData.business.addressCommercial}
            </div>
            <div className="text-[10px]">
              Dom.Fie: {ticketData.business.addressFiscal}
            </div>
            <div className="text-[10px]">
              Ingresos Brutos: {ticketData.business.taxId}
            </div>
            <div className="text-[10px]">
              IVA RESPONSABLE INSCRIPTO
            </div>
            <div className="text-[10px]">
              Inicio de actividades: {ticketData.business.activityStartDate}
            </div>
            <div className="text-[10px]">
              Agente IIBB {ticketData.business.iibbAgent}
            </div>
          </div>

          {/* Separator */}
          <div className="my-2 border-t border-gray-300"></div>

          {/* Voucher Info */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Fecha: {ticketData.voucher.date.split('-').reverse().join('/')}</span>
              <span>Hora: {ticketData.voucher.time}</span>
            </div>
          </div>

          {/* Separator */}
          <div className="my-2 border-t border-gray-300"></div>

          <div className="space-y-0.5">
            <div className="text-center font-bold text-[11px]">
              ORIGINAL
            </div>
            <div className="text-center font-bold">
              FACTURA {ticketData.voucher.type} (Cod. {ticketData.voucher.typeCode}) a CONSUMIDOR FINAL
            </div>
            <div className="text-center">
              Nro. {String(ticketData.voucher.pointOfSale).padStart(5, '0')} -{' '}
              {String(ticketData.voucher.number).padStart(8, '0')}
            </div>
          </div>

          {/* Separator */}
          <div className="my-2 border-t border-gray-300"></div>

          {/* Items */}
          <div className="space-y-1">
            {ticketData.items.map((item) => (
              <div key={item.id} className="space-y-0">
                <div>
                  {item.quantity} x {formatMoney(item.unitPrice)}
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px]">
                    {item.code ? `${item.code} ` : ''}
                    {item.description}
                  </span>
                  <span>{formatMoney(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="my-2 border-t border-gray-300"></div>

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>SUBTOT. SIN DESCUENTOS</span>
              <span>{formatMoney(ticketData.amounts.subtotal)}</span>
            </div>

            {ticketData.promotions.length > 0 && (
              <div className="flex justify-between">
                <span>DESCUENTOS POR PROMOCIONES</span>
                <span>-{formatMoney(ticketData.amounts.discounts)}</span>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="my-2 border-t-2 border-gray-400"></div>

          {/* Total */}
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatMoney(ticketData.amounts.total)}</span>
          </div>

          {/* Separator */}
          <div className="my-2 border-t-2 border-gray-400"></div>

          {/* Tax Info */}
          <div className="space-y-0.5 text-[10px]">
            <div>REGIMEN DE TRANSPARENCIA FISCAL AL</div>
            <div>CONSUMIDOR (LEY 27743)</div>
            <div className="flex justify-between">
              <span>IVA Contenido</span>
              <span>{formatMoney(ticketData.amounts.taxIVA)}</span>
            </div>
            <div className="flex justify-between">
              <span>Otros Impuestos Nacionales Indirectos</span>
              <span>{formatMoney(ticketData.amounts.taxOthers)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos Internos</span>
              <span>$ 0,00</span>
            </div>
            <div className="mt-1">LOS IMPUESTOS INFORMADOS SON SOLO LOS</div>
            <div>CORRESPONDEN A NIVEL NACIONAL</div>
          </div>

          {/* Separator */}
          <div className="my-2 border-t border-gray-300"></div>

          {/* Payment Methods */}
          {ticketData.payment.methods.length > 0 && (
            <div className="space-y-0.5 text-[10px]">
              {ticketData.payment.methods.map((method) => (
                <div key={method.id} className="flex justify-between">
                  <span className="uppercase">{method.type}</span>
                  <span>{formatMoney(method.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span>Suma de sus pagos</span>
                <span>
                  {formatMoney(
                    ticketData.payment.methods.reduce((sum, m) => sum + m.amount, 0)
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Promotions Detail */}
          {ticketData.promotions.length > 0 && (
            <>
              <div className="my-2 border-t border-gray-300"></div>
              <div className="space-y-0.5 text-[10px]">
                <div className="font-bold">DETALLE DE OFERTAS APLICADAS:</div>
                {ticketData.promotions.map((promo) => (
                  <div key={promo.id} className="flex justify-between">
                    <span>{promo.code} {promo.description}</span>
                    <span>-{formatMoney(promo.discount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold">
                  <span>TOTAL AHORRO:</span>
                  <span>{formatMoney(ticketData.amounts.discounts)}</span>
                </div>
              </div>
            </>
          )}

          {/* Customer */}
          {ticketData.customer?.name && (
            <>
              <div className="my-2 border-t border-gray-300"></div>
              <div className="space-y-0.5 text-[10px]">
                <div>CLIENTE: {ticketData.customer.name}</div>
                {ticketData.customer.sequence && (
                  <>
                    <div>Nro. de secuencia: {ticketData.customer.sequence} Caja: {ticketData.metadata.cashRegister}</div>
                    <div>Artículos: {ticketData.customer.totalArticles || ticketData.items.length}</div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="space-y-0.5 text-[10px] text-center">
            <div>
              Cajero: {ticketData.metadata.cashier} {ticketData.metadata.cashRegister}{' '}
              {ticketData.voucher.date.split('-').reverse().join('/')} {ticketData.voucher.time.substring(0, 5)} AC-00
            </div>
            {ticketData.metadata.operationCode && (
              <div>{ticketData.metadata.operationCode}</div>
            )}
          </div>

          {/* QR and CAE Section */}
          <div className="space-y-1 text-center">
            {/* QR Code */}
            <div className="flex justify-center my-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-24 h-24"
                />
              ) : (
                <div className="w-24 h-24 border-2 border-gray-300 flex items-center justify-center text-[8px] text-gray-400">
                  Cargando QR...
                </div>
              )}
            </div>
            <div className="text-[9px]">
              xxReferencia Electronica del comprobante
            </div>
            {ticketData.voucher.cae && (
              <>
                <div className="text-[10px] font-bold">CAE {ticketData.voucher.cae}</div>
                {ticketData.voucher.caeExpiration && (
                  <div className="text-[9px]">
                    Fecha de Vto: {new Date(ticketData.voucher.caeExpiration).toLocaleDateString('es-AR')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Actualización en tiempo real
      </div>
    </div>
  );
}
