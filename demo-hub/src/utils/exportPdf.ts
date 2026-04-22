import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportPdfOptions {
  sections: (HTMLElement | null)[];
  title: string;
  dateRange: string;
}

export async function exportReportPdf({ sections, title, dateRange }: ExportPdfOptions) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yOffset = margin;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, yOffset + 7);
  yOffset += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Date range: Last ${dateRange} days  •  Exported: ${new Date().toLocaleString()}`, margin, yOffset + 4);
  yOffset += 12;
  pdf.setTextColor(0);

  // Draw a separator line
  pdf.setDrawColor(200);
  pdf.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 8;

  for (const section of sections) {
    if (!section) continue;

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    // Check if we need a new page
    if (yOffset + imgHeight > pageHeight - margin) {
      pdf.addPage();
      yOffset = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
    yOffset += imgHeight + 8;
  }

  pdf.save(`demo-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
