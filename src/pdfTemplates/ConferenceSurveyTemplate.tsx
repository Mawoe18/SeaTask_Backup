import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import fontkit from '@pdf-lib/fontkit';

interface ConferenceSurveyData {
    seatecRepName: string;
    position: string;
    customerName: string;
    contactPerson: string;
    physicalLocation: string;
    surveyDate: string;
    expectedCompletionDate: string;
    phoneNo: string;
    roomSize: string;
    ceilingType: string;
    floorType: string;
    lighting: string;
    wallType: string;
    soundAcoustics: string;
    powerSourcesInPlace: boolean;
    powerSourcesRequired: boolean;
    cablingDetails: string;
    networkPointsYes: boolean;
    networkPointsNo: boolean;
    networkPointsDescription: string;
    powerBackup: string;
    noOfPeople: string;
    conferencingPlatform: string;
    internetSourceCapacity: string;
    screenTypeSize: string;
    amplifiersNeeded: string;
    clickShareDevice: string;
    roomControlPanel: string;
    interactiveScreen: string;
    projector: string;
    speakers: string;
    microphone: string;
    tabletsPC: string;
    conferencePhone: string;
    comments: string;
    signed: string;
    attachmentsPictures: boolean;
    attachmentsDrawings: boolean;
    attachmentsOthers: boolean;
    date: string;
    timeTaken: string;
    seatecSignature: string;
}

export async function generateConferenceSurveyPDF(
  formData: ConferenceSurveyData,
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
      'VIDEO CONFERENCE SURVEY FORM',
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
    { label: 'Name of Seatec Representative:', value: formData.seatecRepName || '' },
    { label: 'Position:', value: formData.position || '' },
    { label: 'Customer Name:', value: formData.customerName || '' },
    { label: 'Contact Person:', value: formData.contactPerson || '' },
    { label: 'Physical Location/Address:', value: formData.physicalLocation || '' },
    { label: 'Date of Survey:', value: formData.surveyDate || '' },
    { label: 'Expected Completion Date:', value: formData.expectedCompletionDate || '' },
    { label: 'Phone No.:', value: formData.phoneNo || '' },
  ];

  generalFields.forEach((field) => {
    addNewPageIfNeeded(26);
    page.drawText(field.label, { x: 50, y, size: 12, font: helvetica, color: blackColor });
    const valueX = 50 + helvetica.widthOfTextAtSize(field.label, 12) + 10;
    drawDottedLine(page, valueX, width - 50, y);
    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - valueX - 50);
    let currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: valueX, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 18;
    });
    y -= 28; // Adjusted spacing (18 for text height + 10 for gap)
  });

  y -= 10;

  // Room
  addNewPageIfNeeded(20);
  page.drawText('ROOM', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const roomFields = [
    { label: 'Size (Dimensions):', value: formData.roomSize || '' },
  ];

  roomFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Physical Characteristics
  addNewPageIfNeeded(20);
  page.drawText('PHYSICAL CHARACTERISTICS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const physicalFields = [
    { label: 'Ceiling Type:', value: formData.ceilingType || '' },
    { label: 'Floor Type:', value: formData.floorType || '' },
    { label: 'Lighting (Natural/Electrical):', value: formData.lighting || '' },
    { label: 'Wall Type:', value: formData.wallType || '' },
    { label: 'Sound/Acoustics:', value: formData.soundAcoustics || '' },
  ];

  physicalFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Power Sources
  addNewPageIfNeeded(20);
  page.drawText('POWER SOURCES', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const powerSourcesFields = [
    { label: 'In Place:', value: formData.powerSourcesInPlace ? 'Yes' : 'No' },
    { label: 'Required:', value: formData.powerSourcesRequired ? 'Yes' : 'No' },
  ];

  powerSourcesFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Cabling/Trunking/Drilling
  addNewPageIfNeeded(20);
  page.drawText('CABLING/TRUNKING/DRILLING', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const cablingFields = [
    { label: 'Please provide details:', value: formData.cablingDetails || '' },
  ];

  cablingFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Network Points (PoE/Non-PoE)
  addNewPageIfNeeded(20);
  page.drawText('NETWORK POINTS (POE/NON-POE)', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const networkPointsFields = [
    { label: 'Yes:', value: formData.networkPointsYes ? 'Yes' : 'No' },
    { label: 'No:', value: formData.networkPointsNo ? 'Yes' : 'No' },
    { label: 'Description:', value: formData.networkPointsDescription || '' },
  ];

  networkPointsFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Power Backup
  addNewPageIfNeeded(20);
  page.drawText('POWER BACKUP', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const powerBackupFields = [
    { label: 'Power Backup:', value: formData.powerBackup || '' },
  ];

  powerBackupFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Proposed Use
  addNewPageIfNeeded(20);
  page.drawText('PROPOSED USE', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const proposedUseFields = [
    { label: 'No. of People:', value: formData.noOfPeople || '' },
    { label: 'Conferencing Platform to be Interfaced (Zoom, Teams, Google Meet):', value: formData.conferencingPlatform || '' },
  ];

  proposedUseFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Internet Source & Capacity
  addNewPageIfNeeded(20);
  page.drawText('INTERNET SOURCE & CAPACITY', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const internetFields = [
    { label: 'Internet Source & Capacity:', value: formData.internetSourceCapacity || '' },
  ];

  internetFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Devices to be Integrated
  addNewPageIfNeeded(20);
  page.drawText('DEVICES TO BE INTEGRATED', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const devicesFields = [
    { label: 'Screen Type/Size:', value: formData.screenTypeSize || '' },
    { label: 'Amplifiers If Needed:', value: formData.amplifiersNeeded || '' },
    { label: 'ClickShare/Similar Device:', value: formData.clickShareDevice || '' },
    { label: 'Room Control Panel:', value: formData.roomControlPanel || '' },
    { label: 'Interactive Screen:', value: formData.interactiveScreen || '' },
    { label: 'Projector:', value: formData.projector || '' },
    { label: 'Speakers:', value: formData.speakers || '' },
    { label: 'Microphone:', value: formData.microphone || '' },
    { label: 'Tablets/PC:', value: formData.tabletsPC || '' },
    { label: 'Conference Phone:', value: formData.conferencePhone || '' },
  ];

  devicesFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Comments
  addNewPageIfNeeded(20);
  page.drawText('COMMENTS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const commentsFields = [
    { label: 'Comments:', value: formData.comments || '' },
  ];

  commentsFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });


  // Attachments (Please Tick)
  addNewPageIfNeeded(20);
  page.drawText('ATTACHMENTS (PLEASE TICK)', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const attachmentsFields = [
    { label: 'Pictures:', value: formData.attachmentsPictures ? 'Yes' : 'No' },
    { label: 'Drawings:', value: formData.attachmentsDrawings ? 'Yes' : 'No' },
    { label: 'Others:', value: formData.attachmentsOthers ? 'Yes' : 'No' },
  ];

  attachmentsFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Date, Time Taken
  addNewPageIfNeeded(20);
  page.drawText('DATE, TIME TAKEN', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const dateTimeFields = [
    { label: 'Date:', value: formData.date || '' },
    { label: 'Time Taken:', value: formData.timeTaken || '' },
  ];

  dateTimeFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 12, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: blackColor });
      currentY -= 16;
    });
    y -= labelLines.count * 16;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 12, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 12, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= valueLines.count * 16 + 8;
  });

  // Signatures Section
  addNewPageIfNeeded(150);
  page.drawText('SIGNATURES', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  page.drawText('SEATEC REPRESENTATIVE', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  // SEATEC Representative Name
  page.drawText(formData.seatecRepName || 'N/A', { x: 50, y, size: 12, font: helvetica, color: primaryBlue });
  y -= 12;

  // Signature container
  const containerWidth = 200;
  const containerHeight = 50;
  const seatecContainerX = 50; // Shifted right if needed, but keeping 50 as per form
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
};