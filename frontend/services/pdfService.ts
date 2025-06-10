
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Package, PackageContentItem } from '../types';
import { QR_CODE_PREFIX } from '../constants';

// Removed: declare const jsPDF: any;
// Removed: declare const html2canvas: any;

export const generatePdfLabel = async (pkg: Package, qrCodeDataUrl: string): Promise<void> => {
  const labelElement = document.createElement('div');
  labelElement.style.width = '400px'; // Approx 4 inches at 96 DPI
  labelElement.style.height = '300px'; // Approx 3 inches at 96 DPI
  labelElement.style.padding = '20px';
  labelElement.style.border = '1px solid black';
  labelElement.style.fontFamily = 'Arial, sans-serif';
  labelElement.style.backgroundColor = 'white';
  labelElement.style.color = 'black';
  labelElement.style.position = 'absolute'; // For html2canvas rendering
  labelElement.style.left = '-9999px'; // Hide off-screen

  const contentSummary = pkg.contents.slice(0, 3).map((item: PackageContentItem) => `${item.name} (Qty: ${item.quantity})`).join(', ') + (pkg.contents.length > 3 ? '...' : '');

  labelElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; height: 100%;">
      <div style="flex-grow: 1; padding-right: 15px;">
        <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${pkg.id.toUpperCase()}</h2>
        <p style="font-size: 14px; margin: 0 0 5px 0;"><strong>Type:</strong> ${pkg.type}</p>
        <p style="font-size: 14px; margin: 0 0 5px 0;"><strong>Origin:</strong> ${pkg.roomOfOrigin}</p>
        <p style="font-size: 14px; margin: 0 0 5px 0;"><strong>Contents:</strong> ${pkg.contentType}</p>
        <p style="font-size: 12px; margin: 0 0 10px 0; max-height: 40px; overflow: hidden;"><em>${contentSummary}</em></p>
        <p style="font-size: 14px; margin: 0;"><strong>Destination:</strong> ${pkg.locationStatus === 'At Destination Address' ? 'ARRIVED' : 'PENDING'}</p>
      </div>
      <div style="flex-shrink: 0; text-align: center;">
        <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 100px; height: 100px; margin-bottom: 5px;" />
        <p style="font-size: 10px; margin: 0;">${QR_CODE_PREFIX}${pkg.id}</p>
      </div>
    </div>
  `;
  document.body.appendChild(labelElement);

  try {
    const canvas = await html2canvas(labelElement, { scale: 2 }); // Increase scale for better quality
    const imgData = canvas.toDataURL('image/png');
    
    // Assuming standard label size like Avery 5163 (4" x 2"), use landscape for simplicity here
    // PDF dimensions in points (72 DPI). 4 inches = 288 points, 3 inches = 216 points.
    // Let's make it slightly smaller to fit.
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px', // use pixels
      format: [400, 300] // width, height in pixels matching the element
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 400, 300);
    pdf.save(`${pkg.id}-label.pdf`);

  } catch (error) {
    console.error("Error generating PDF label:", error);
    alert("Failed to generate PDF label. See console for details.");
  } finally {
    document.body.removeChild(labelElement);
  }
};
