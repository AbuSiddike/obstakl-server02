const PDFDocument = require('pdfkit');

function generateEarningsPDF(stream, data) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Styled Header
  doc.fillColor('#1e293b')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('OBSTAKL', { align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#64748b')
     .text('Property Rental & Booking Platform', { align: 'center' });
  
  doc.moveDown(1.5);

  // Report Title Box
  doc.rect(50, doc.y, 512, 40)
     .fill('#f1f5f9');
  
  doc.fillColor('#0f172a')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('MONTHLY EARNINGS & BOOKINGS REPORT', 60, doc.y - 30);
  
  doc.moveDown(2);

  // Owner Details
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('REPORT FOR:', { continued: true });
  doc.font('Helvetica').fillColor('#475569').text(` ${data.ownerName} (${data.ownerEmail})`);
  doc.font('Helvetica-Bold').fillColor('#334155').text('GENERATED ON:', { continued: true });
  doc.font('Helvetica').fillColor('#475569').text(` ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
  
  doc.moveDown(1.5);

  // Summary stats cards
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Performance Summary');
  doc.moveDown(0.5);

  // Draw bounding boxes for analytics
  const startY = doc.y;
  
  // Card 1: Total Earnings
  doc.rect(50, startY, 160, 60).fillAndStroke('#ecfdf5', '#10b981');
  doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold').text('TOTAL EARNINGS', 60, startY + 12);
  doc.fontSize(14).text(`$${data.totalEarnings.toFixed(2)}`, 60, startY + 30);

  // Card 2: Total Properties
  doc.rect(226, startY, 160, 60).fillAndStroke('#eff6ff', '#3b82f6');
  doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica-Bold').text('TOTAL PROPERTIES', 236, startY + 12);
  doc.fontSize(14).text(`${data.totalProperties}`, 236, startY + 30);

  // Card 3: Total Bookings
  doc.rect(402, startY, 160, 60).fillAndStroke('#faf5ff', '#a855f7');
  doc.fillColor('#581c87').fontSize(10).font('Helvetica-Bold').text('CONFIRMED BOOKINGS', 412, startY + 12);
  doc.fontSize(14).text(`${data.totalBookings}`, 412, startY + 30);

  doc.y = startY + 80;
  doc.moveDown();

  // Booking history table
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Recent Confirmed Bookings');
  doc.moveDown(0.5);

  // Table header row background
  const tableHeaderY = doc.y;
  doc.rect(50, tableHeaderY, 512, 22).fill('#475569');
  
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('DATE', 60, tableHeaderY + 6, { width: 80 });
  doc.text('PROPERTY TITLE', 140, tableHeaderY + 6, { width: 180 });
  doc.text('TENANT NAME', 320, tableHeaderY + 6, { width: 120 });
  doc.text('AMOUNT PAID', 440, tableHeaderY + 6, { width: 110, align: 'right' });

  doc.y = tableHeaderY + 22;
  doc.font('Helvetica').fillColor('#334155');

  let stripeRow = false;
  
  if (data.bookings && data.bookings.length > 0) {
    data.bookings.forEach((booking) => {
      // Check if we will overflow the page
      if (doc.y > 700) {
        doc.addPage();
        // Redraw table header on new page
        const newPageHeaderY = doc.y;
        doc.rect(50, newPageHeaderY, 512, 22).fill('#475569');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('DATE', 60, newPageHeaderY + 6, { width: 80 });
        doc.text('PROPERTY TITLE', 140, newPageHeaderY + 6, { width: 180 });
        doc.text('TENANT NAME', 320, newPageHeaderY + 6, { width: 120 });
        doc.text('AMOUNT PAID', 440, newPageHeaderY + 6, { width: 110, align: 'right' });
        doc.y = newPageHeaderY + 22;
        doc.font('Helvetica').fillColor('#334155');
      }

      const rowY = doc.y;
      if (stripeRow) {
        doc.rect(50, rowY, 512, 20).fill('#f8fafc');
        doc.fillColor('#334155');
      }
      
      const dateStr = new Date(booking.createdAt).toLocaleDateString();
      
      doc.text(dateStr, 60, rowY + 5, { width: 80 });
      doc.text(booking.propertyName, 140, rowY + 5, { width: 180 });
      doc.text(booking.tenant.name, 320, rowY + 5, { width: 120 });
      doc.text(`$${booking.amountPaid.toFixed(2)}`, 440, rowY + 5, { width: 110, align: 'right' });
      
      doc.y = rowY + 20;
      stripeRow = !stripeRow;
    });
  } else {
    doc.text('No booking transactions found.', 60, doc.y + 10, { align: 'center' });
  }

  // Footer note on all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94a3b8')
       .fontSize(8)
       .text(
         `Obstakl Property Rental & Booking Platform | Page ${i + 1} of ${pages.count}`,
         50,
         750,
         { align: 'center', width: 512 }
       );
  }

  doc.end();
}

module.exports = { generateEarningsPDF };
