import { TicketData } from './types';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export async function generatePDF(ticketData: TicketData): Promise<void> {
  // Create PDF with thermal printer dimensions (80mm width)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297], // 80mm width, auto height
  });

  const pageWidth = 80;
  let currentY = 5;
  const leftMargin = 2;
  const rightMargin = pageWidth - 2;
  const centerX = pageWidth / 2;

  // Helper functions
  const addText = (text: string, x: number, y: number, fontSize: number = 8, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    pdf.text(text, x, y, { align });
  };

  const addLine = (y: number) => {
    pdf.line(leftMargin, y, rightMargin, y);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Header - Business Info
  pdf.setFont('courier', 'bold');
  addText(ticketData.business.tradeName, centerX, currentY, 11, 'center');
  currentY += 5;

  pdf.setFont('courier', 'normal');
  addText(ticketData.business.legalName, centerX, currentY, 9, 'center');
  currentY += 4;

  addText(`CUIT Nro: ${ticketData.business.cuit}`, centerX, currentY, 8, 'center');
  currentY += 4;

  addText(`Dom.Com: ${ticketData.business.addressCommercial}`, centerX, currentY, 7, 'center');
  currentY += 3.5;

  addText(`Dom.Fie: ${ticketData.business.addressFiscal}`, centerX, currentY, 7, 'center');
  currentY += 3.5;

  addText(`Ingresos Brutos: ${ticketData.business.taxId}`, centerX, currentY, 7, 'center');
  currentY += 3.5;

  addText('IVA RESPONSABLE INSCRIPTO', centerX, currentY, 7, 'center');
  currentY += 3.5;

  addText(`Inicio de actividades: ${ticketData.business.activityStartDate}`, centerX, currentY, 7, 'center');
  currentY += 3.5;

  addText(`Agente IIBB ${ticketData.business.iibbAgent}`, centerX, currentY, 7, 'center');
  currentY += 5;

  // Separator
  addLine(currentY);
  currentY += 4;

  // Voucher Info
  const formattedDate = ticketData.voucher.date.split('-').reverse().join('/');
  addText(`Fecha: ${formattedDate}`, leftMargin, currentY, 8);
  addText(`Hora: ${ticketData.voucher.time}`, rightMargin, currentY, 8, 'right');
  currentY += 5;

  // Separator
  addLine(currentY);
  currentY += 4;

  pdf.setFont('courier', 'bold');
  addText('ORIGINAL', centerX, currentY, 9, 'center');
  currentY += 4;

  addText(
    `FACTURA ${ticketData.voucher.type} (Cod. ${ticketData.voucher.typeCode})`,
    centerX,
    currentY,
    8,
    'center'
  );
  currentY += 4;

  addText('a CONSUMIDOR FINAL', centerX, currentY, 8, 'center');
  currentY += 4;

  const voucherNumber = `Nro. ${String(ticketData.voucher.pointOfSale).padStart(5, '0')}-${String(
    ticketData.voucher.number
  ).padStart(8, '0')}`;
  addText(voucherNumber, centerX, currentY, 8, 'center');
  currentY += 5;

  pdf.setFont('courier', 'normal');

  // Separator
  addLine(currentY);
  currentY += 4;

  // Items
  ticketData.items.forEach((item) => {
    addText(`${item.quantity} x ${formatMoney(item.unitPrice)}`, leftMargin, currentY, 8);
    currentY += 4;

    const description = item.code ? `${item.code} ${item.description}` : item.description;
    const maxWidth = pageWidth - 4;
    const lines = pdf.splitTextToSize(description, maxWidth);

    lines.forEach((line: string, index: number) => {
      if (index === lines.length - 1) {
        addText(line, leftMargin, currentY, 7);
        addText(formatMoney(item.subtotal), rightMargin, currentY, 8, 'right');
      } else {
        addText(line, leftMargin, currentY, 7);
      }
      currentY += 3.5;
    });

    currentY += 1;
  });

  currentY += 2;

  // Separator
  addLine(currentY);
  currentY += 4;

  // Totals
  addText('SUBTOT. SIN DESCUENTOS', leftMargin, currentY, 8);
  addText(formatMoney(ticketData.amounts.subtotal), rightMargin, currentY, 8, 'right');
  currentY += 4;

  if (ticketData.promotions.length > 0) {
    addText('DESCUENTOS POR PROMOCIONES', leftMargin, currentY, 8);
    addText(`-${formatMoney(ticketData.amounts.discounts)}`, rightMargin, currentY, 8, 'right');
    currentY += 5;
  }

  // Separator
  pdf.setLineWidth(0.5);
  addLine(currentY);
  currentY += 5;

  // Total
  pdf.setFont('courier', 'bold');
  addText('TOTAL', leftMargin, currentY, 10);
  addText(formatMoney(ticketData.amounts.total), rightMargin, currentY, 10, 'right');
  currentY += 6;

  pdf.setFont('courier', 'normal');

  // Separator
  pdf.setLineWidth(0.5);
  addLine(currentY);
  currentY += 4;
  pdf.setLineWidth(0.1);

  // Tax Info
  addText('REGIMEN DE TRANSPARENCIA FISCAL AL', centerX, currentY, 7, 'center');
  currentY += 3.5;
  addText('CONSUMIDOR (LEY 27743)', centerX, currentY, 7, 'center');
  currentY += 4;

  addText('IVA Contenido', leftMargin, currentY, 7);
  addText(formatMoney(ticketData.amounts.taxIVA), rightMargin, currentY, 7, 'right');
  currentY += 3.5;

  addText('Otros Impuestos Nacionales Indirectos', leftMargin, currentY, 7);
  addText(formatMoney(ticketData.amounts.taxOthers), rightMargin, currentY, 7, 'right');
  currentY += 3.5;

  addText('Impuestos Internos', leftMargin, currentY, 7);
  addText('$ 0,00', rightMargin, currentY, 7, 'right');
  currentY += 4;

  addText('LOS IMPUESTOS INFORMADOS SON SOLO LOS', leftMargin, currentY, 7);
  currentY += 3.5;
  addText('CORRESPONDEN A NIVEL NACIONAL', leftMargin, currentY, 7);
  currentY += 5;

  // Separator
  addLine(currentY);
  currentY += 4;

  // Payment Methods
  if (ticketData.payment.methods.length > 0) {
    ticketData.payment.methods.forEach((method) => {
      const methodName = method.type.toUpperCase();
      addText(methodName, leftMargin, currentY, 7);
      addText(formatMoney(method.amount), rightMargin, currentY, 7, 'right');
      currentY += 3.5;
    });

    const totalPayments = ticketData.payment.methods.reduce((sum, m) => sum + m.amount, 0);
    addText('Suma de sus pagos', leftMargin, currentY, 7);
    addText(formatMoney(totalPayments), rightMargin, currentY, 7, 'right');
    currentY += 5;

    addLine(currentY);
    currentY += 4;
  }

  // Promotions Detail
  if (ticketData.promotions.length > 0) {
    addLine(currentY);
    currentY += 4;

    pdf.setFont('courier', 'bold');
    addText('DETALLE DE OFERTAS APLICADAS:', leftMargin, currentY, 7);
    currentY += 4;

    pdf.setFont('courier', 'normal');
    ticketData.promotions.forEach((promo) => {
      addText(`${promo.code} ${promo.description}`, leftMargin, currentY, 7);
      addText(`-${formatMoney(promo.discount)}`, rightMargin, currentY, 7, 'right');
      currentY += 3.5;
    });

    pdf.setFont('courier', 'bold');
    addText('TOTAL AHORRO:', leftMargin, currentY, 7);
    addText(formatMoney(ticketData.amounts.discounts), rightMargin, currentY, 7, 'right');
    currentY += 5;

    pdf.setFont('courier', 'normal');
  }

  // Customer
  if (ticketData.customer?.name) {
    addLine(currentY);
    currentY += 4;

    addText(`CLIENTE: ${ticketData.customer.name}`, leftMargin, currentY, 7);
    currentY += 3.5;

    if (ticketData.customer.sequence) {
      addText(
        `Nro. de secuencia: ${ticketData.customer.sequence} Caja: ${ticketData.metadata.cashRegister}`,
        leftMargin,
        currentY,
        7
      );
      currentY += 3.5;

      addText(
        `Artículos: ${ticketData.customer.totalArticles || ticketData.items.length}`,
        leftMargin,
        currentY,
        7
      );
      currentY += 5;
    }
  }

  // Footer
  const timeFormatted = ticketData.voucher.time.substring(0, 5);
  addText(
    `Cajero: ${ticketData.metadata.cashier} ${ticketData.metadata.cashRegister} ${formattedDate} ${timeFormatted} AC-00`,
    centerX,
    currentY,
    7,
    'center'
  );
  currentY += 3.5;

  if (ticketData.metadata.operationCode) {
    addText(ticketData.metadata.operationCode, centerX, currentY, 7, 'center');
    currentY += 5;
  }

  // QR and Electronic Reference (always shown)
  // Generate QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL('https://www.hiperlibertad.com.ar', {
      width: 200,
      margin: 1,
    });

    // QR dimensions: 25mm x 25mm
    const qrSize = 25;
    const qrX = centerX - (qrSize / 2);

    pdf.addImage(qrDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);
    currentY += qrSize + 2;
  } catch (error) {
    console.error('Error generating QR code:', error);
    currentY += 25 + 2; // Skip QR space if error
  }

  // Electronic Reference Text
  addText(
    'xxReferencia Electronica del comprobante',
    centerX,
    currentY,
    7,
    'center'
  );
  currentY += 4;

  // CAE (optional)
  if (ticketData.voucher.cae) {
    pdf.setFont('courier', 'bold');
    addText(`CAE ${ticketData.voucher.cae}`, centerX, currentY, 8, 'center');
    currentY += 4;

    pdf.setFont('courier', 'normal');
    if (ticketData.voucher.caeExpiration) {
      const caeExpDate = new Date(ticketData.voucher.caeExpiration);
      const caeExpFormatted = `${String(caeExpDate.getDate()).padStart(2, '0')}/${String(
        caeExpDate.getMonth() + 1
      ).padStart(2, '0')}/${caeExpDate.getFullYear().toString().slice(-2)}`;
      addText(`Fecha de Vto: ${caeExpFormatted}`, centerX, currentY, 7, 'center');
      currentY += 5;
    }
  }

  // Download PDF
  const fileName = `Ticket_${ticketData.voucher.pointOfSale}_${ticketData.voucher.number}_${ticketData.voucher.date}.pdf`;
  pdf.save(fileName);
}
