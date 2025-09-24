import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import fontkit from '@pdf-lib/fontkit';

interface CCTVFormData {
  organizationName: string;
  location: string;
  natureOfBusiness: string;
  intendedUse: string;
  floorPlanRequest: string;
  existingCablingInfrastructure: string;
  cablingDescription: string;
  ductPresence: boolean;
  laidPipes: boolean;
  trunking: boolean;
  existingNetworkInfrastructure: string;
  networkDescription: string;
  cabinetSpace: boolean;
  networkScalability: boolean;
  numberOfBuildings: string;
  buildingsNetworked: string;
  fullCoverage: string;
  areasToCover: string;
  fieldOfViewDescription: string;
  mountingSurfaces: string;
  ceilingHeight: string;
  obstacles: string;
  preferredFeatures: string;
  destructiveFactors: string;
  existingEquipmentRoom: string;
  rackSpaceAvailable: string;
  equipmentLocationDescription: string;
  monitoredFromEquipmentRoom: string;
  preferredMonitoringLocation: string;
  preferredDisplayType: string;
  videoRetentionDuration: string;
  seatecSignature: string;
  seatecRepNameSig: string;
}

export async function generateCCTVSurveyPDF(
  formData: CCTVFormData,
  savePath: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  let page = pdfDoc.addPage([595, 842]); // A4 size
  let currentPageNumber = 1;
  const { width, height } = page.getSize();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load custom font for logo if available
  let logoFont = helveticaBold; // Fallback
  try {
    const fontAsset = Asset.fromModule(require('../../assets/fonts/gill-sans-nova-heavy.ttf'));
    await fontAsset.downloadAsync();
    const fontUri = fontAsset.localUri;
    if (fontUri) {
      const fontBytes = await FileSystem.readAsStringAsync(fontUri, { encoding: FileSystem.EncodingType.Base64 });
      const fontUint8Array = Uint8Array.from(atob(fontBytes), c => c.charCodeAt(0));
      logoFont = await pdfDoc.embedFont(fontUint8Array);
    }
  } catch (error) {
    console.log('Custom font not loaded, using fallback:', error);
  }

  // Colors
  const blackColor = rgb(0, 0, 0);
  const primaryBlue = rgb(36 / 255, 131 / 255, 197 / 255);
  const borderColor = rgb(0.75, 0.75, 0.75);

  // Helper function for dotted lines
  const drawDottedLine = (page: any, startX: number, endX: number, yPos: number, color = blackColor) => {
    const dotSpacing = 3;
    for (let x = startX; x < endX; x += dotSpacing * 2) {
      page.drawCircle({
        x: Math.min(x, endX - 1),
        y: yPos - 5,
        size: 0.5,
        color,
      });
    }
  };

  // Helper for wrapping text with consistent width for all lines
  const wrapTextToFitLine = (text: string, font: any, fontSize: number, maxWidth: number): { lines: string[], count: number } => {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Handle very long words
          let tempWord = word;
          while (tempWord.length > 0) {
            let i = tempWord.length;
            while (i > 0 && font.widthOfTextAtSize(tempWord.substring(0, i), fontSize) > maxWidth) {
              i--;
            }
            lines.push(tempWord.substring(0, i));
            tempWord = tempWord.substring(i);
          }
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return { lines, count: lines.length };
  };

  // Helper to add new page if needed and draw header/footer
  const addNewPageIfNeeded = (requiredHeight: number, margin = 80) => {
    if (y - requiredHeight < margin) {
      drawFooter(page, height);
      page = pdfDoc.addPage([595, 842]);
      currentPageNumber++;
      y = height - 60; // Only logo, no title on subsequent pages
      drawSubsequentPageLogo(page, width, height);
    }
  };

  // Draw header with logo and title (first page only)
  const drawHeader = (page: any, width: number, height: number) => {
    // Logo positioned higher up
    const logoText = "seatec";
    const logoSize = 36;
    const logoWidth = logoFont.widthOfTextAtSize(logoText, logoSize);
    const logoX = width - logoWidth - 50;
    page.drawText(logoText, { x: logoX, y: height - 45, size: logoSize, font: logoFont, color: primaryBlue });

    // Title - only on first page
    let titleY = height - 70;
    const titleLines = [
      'CCTV SURVEY FORM',
    ];
    titleLines.forEach((line, index) => {
      const size = index === 0 ? 14 : 12;
      const fontToUse = index === 0 ? helveticaBold : helvetica;
      const textWidth = fontToUse.widthOfTextAtSize(line, size);
      page.drawText(line, { x: (width - textWidth) / 2, y: titleY, size, font: fontToUse, color: blackColor });
      titleY -= size + 5;
    });
  };

  // Draw only logo on subsequent pages
  const drawSubsequentPageLogo = (page: any, width: number, height: number) => {
    const logoText = "seatec";
    const logoSize = 36;
    const logoWidth = logoFont.widthOfTextAtSize(logoText, logoSize);
    const logoX = width - logoWidth - 50;
    page.drawText(logoText, { x: logoX, y: height - 45, size: logoSize, font: logoFont, color: primaryBlue });
  };

  // Draw footer
  const drawFooter = (page: any, height: number) => {
    const footerY = 30;
    const footerText1 = "Empowering You to Win with IT";
    const footerWidth1 = helveticaBold.widthOfTextAtSize(footerText1, 10);
    page.drawText(footerText1, {
      x: (width - footerWidth1) / 2,
      y: footerY + 15,
      size: 10,
      font: helveticaBold,
      color: primaryBlue,
    });

    const footerText2 = "IT Infrastructure Services | Business Software | Connectivity";
    const footerWidth2 = helveticaBold.widthOfTextAtSize(footerText2, 10);
    page.drawText(footerText2, {
      x: (width - footerWidth2) / 2,
      y: footerY,
      size: 10,
      font: helveticaBold,
      color: primaryBlue,
    });

    const footerText3 = "info@seatectelecom.com; 0271441810; www.seatectelecom.com";
    const footerWidth3 = helvetica.widthOfTextAtSize(footerText3, 9);
    page.drawText(footerText3, {
      x: (width - footerWidth3) / 2,
      y: footerY - 12,
      size: 9,
      font: helvetica,
      color: primaryBlue,
    });

    const address = "Location: Plot No. A603, Heavy Industrial Area, Accra Road, Tema, Ghana";
    const addressWidth = helvetica.widthOfTextAtSize(address, 8);
    page.drawText(address, {
      x: (width - addressWidth) / 2,
      y: footerY - 22,
      size: 8,
      font: helvetica,
      color: primaryBlue,
    });
  };

  // Helper function to draw signature
  const drawSignatureInContainer = async (
    pdfDoc: PDFDocument,
    page: any,
    signatureData: string,
    containerX: number,
    containerY: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    try {
      const base64Data = signatureData.replace(/^data:image\/[^;]+;base64,/, '');
      const signatureBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      let signatureImage;
      try {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
      } catch (pngError) {
        try {
          signatureImage = await pdfDoc.embedJpg(signatureBytes);
        } catch (jpgError) {
          console.error('Could not embed signature as PNG or JPG:', jpgError);
          return;
        }
      }

      const availableWidth = containerWidth - 2;
      const availableHeight = containerHeight - 6;
      const aspectRatio = signatureImage.width / signatureImage.height;

      let sigWidth = availableWidth * 0.95; // Scaled for prominence
      let sigHeight = sigWidth / aspectRatio;

      if (sigHeight > availableHeight) {
        sigHeight = availableHeight;
        sigWidth = sigHeight * aspectRatio;
        if (sigWidth < availableWidth * 0.8) {
          sigWidth = availableWidth * 0.9;
        }
      }

      const signatureCenterX = containerX + (containerWidth / 2);
      const signatureX = signatureCenterX - (sigWidth / 2);
      const signatureYPos = containerY + (availableHeight / 2) + (sigHeight / 2) - 5;

      page.drawImage(signatureImage, {
        x: signatureX,
        y: signatureYPos - sigHeight,
        width: sigWidth,
        height: sigHeight,
        opacity: 1.0,
      });
    } catch (error) {
      console.error('Error embedding signature:', error);
    }
  };

  // Initial header on first page
  drawHeader(page, width, height);
  let y = height - 100;

  // General Information
  addNewPageIfNeeded(26);
  page.drawText('GENERAL INFORMATION', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const generalFields = [
    { label: 'Name of Organization:', value: formData.organizationName || '' },
    { label: 'Location:', value: formData.location || '' },
    { label: 'Nature of Business:', value: formData.natureOfBusiness || '' },
    { label: 'Intended Use of the Solution:', value: formData.intendedUse || '' },
    { label: 'Request for Floor Plan:', value: formData.floorPlanRequest || '' },
  ];

  generalFields.forEach((field) => {
    addNewPageIfNeeded(26);
    page.drawText(field.label, { x: 50, y, size: 10, font: helvetica, color: blackColor });
    const valueX = 50 + helvetica.widthOfTextAtSize(field.label, 10) + 10;
    drawDottedLine(page, valueX, width - 50, y);
    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - valueX - 50);
    let currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: valueX, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= 26; // Fixed spacing (16 for text height + 10 for gap)
  });

  y -= 10;

  // Cabling and Network Infrastructure
  addNewPageIfNeeded(20);
  page.drawText('CABLING AND NETWORK INFRASTRUCTURE', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const cablingFields = [
    { label: 'Is there an Existing Cabling Infrastructure?:', value: formData.existingCablingInfrastructure || '' },
    { label: 'Cabling Infrastructure Description:', value: formData.existingCablingInfrastructure === 'yes' ? formData.cablingDescription || '' : 'N/A' },
    { label: 'Presence of a Duct for All Floors:', value: formData.ductPresence ? 'Yes' : 'No' },
    { label: 'Laid Pipes (Conduit, Duct):', value: formData.laidPipes ? 'Yes' : 'No' },
    { label: 'Trunking:', value: formData.trunking ? 'Yes' : 'No' },
    { label: 'Is there an Existing Network Infrastructure (LAN/WLAN)?:', value: formData.existingNetworkInfrastructure || '' },
    { label: 'Network Infrastructure Description:', value: formData.existingNetworkInfrastructure === 'yes' ? formData.networkDescription || '' : 'N/A' },
    { label: 'Space in Cabinet:', value: formData.cabinetSpace ? 'Yes' : 'No' },
    { label: 'Scalability of Network Infrastructure:', value: formData.networkScalability ? 'Yes' : 'No' },
  ];

  cablingFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // Camera Requirements
  addNewPageIfNeeded(20);
  page.drawText('CAMERA REQUIREMENTS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const cameraFields = [
    { label: 'Number of Buildings:', value: formData.numberOfBuildings || '' },
    { label: 'Are the Buildings Networked Together?:', value: formData.buildingsNetworked || '' },
    { label: 'Full Camera/CCTV Coverage for All Areas?:', value: formData.fullCoverage || '' },
    { label: 'Areas to be Covered (Indoor or Outdoor):', value: formData.fullCoverage === 'no' ? formData.areasToCover || '' : 'N/A' },
    { label: 'Field of View Coverage and Shape:', value: formData.fieldOfViewDescription || '' },
    { label: 'Mounting Surfaces Description:', value: formData.mountingSurfaces || '' },
    { label: 'Ceiling Height Above Ground Level:', value: formData.ceilingHeight || '' },
  ];

  cameraFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // Additional Factors
  addNewPageIfNeeded(20);
  page.drawText('ADDITIONAL FACTORS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const additionalFields = [
    { label: 'Possible Obstacles Interfering with Field or Quality of View:', value: formData.obstacles || '' },
    { label: 'Preferred Features for Each Area:', value: formData.preferredFeatures || '' },
    { label: 'Destructive/Deteriorating Factors:', value: formData.destructiveFactors || '' },
  ];

  additionalFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // Equipment and Monitoring
  addNewPageIfNeeded(20);
  page.drawText('EQUIPMENT AND MONITORING', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const equipmentFields = [
    { label: 'Existing Equipment/Server Room and Rack Unit?:', value: formData.existingEquipmentRoom || '' },
    { label: 'Rack Space Available:', value: formData.existingEquipmentRoom === 'yes' ? formData.rackSpaceAvailable || '' : 'N/A' },
    { label: 'Possible Location for Equipment:', value: formData.existingEquipmentRoom === 'no' ? formData.equipmentLocationDescription || '' : 'N/A' },
    { label: 'Surveillance Monitored from Equipment Room?:', value: formData.monitoredFromEquipmentRoom || '' },
    { label: 'Preferred Monitoring Location:', value: formData.monitoredFromEquipmentRoom === 'no' ? formData.preferredMonitoringLocation || '' : 'N/A' },
    { label: 'Preferred Display Type, Size, and Number of Screens:', value: formData.preferredDisplayType || '' },
    { label: 'Video Retention/Storage Duration:', value: formData.videoRetentionDuration || '' },
  ];

  equipmentFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // Signatures Section
  addNewPageIfNeeded(150);
  page.drawText('SIGNATURES', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  page.drawText('SEATEC REPRESENTATIVE', { x: 100, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  // SEATEC Representative Name
  page.drawText(formData.seatecRepNameSig || 'N/A', { x: 100, y, size: 12, font: helvetica, color: primaryBlue });
  y -= 12;

  // Signature container
  const containerWidth = 200;
  const containerHeight = 50;
  const seatecContainerX = 100; // Shifted right
  const seatecContainerY = y - containerHeight;

  if (formData.seatecSignature) {
    await drawSignatureInContainer(
      pdfDoc,
      page,
      formData.seatecSignature,
      seatecContainerX,
      seatecContainerY,
      containerWidth,
      containerHeight
    );
  }

  y -= containerHeight + 10;

  // Draw footer on the last page
  drawFooter(page, height);

  // Save the PDF
  const base64 = await pdfDoc.saveAsBase64();
  await FileSystem.writeAsStringAsync(savePath, base64, { encoding: FileSystem.EncodingType.Base64 });
  return savePath;
}