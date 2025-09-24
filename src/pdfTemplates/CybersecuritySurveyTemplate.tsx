import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import fontkit from '@pdf-lib/fontkit';

interface CybersecurityFormData {
  organizationName: string;
  contactPerson: string;
  industry: string;
  seatecRepName: string;
  seatecSignature: string;
  q0: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  q16: string;
  q17: string;
  q18: string;
}

export async function generateCybersecuritySurveyPDF(
  formData: CybersecurityFormData,
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
    const titleLines = ['CYBERSECURITY SURVEY FORM'];
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
    { label: 'Organization Name:', value: formData.organizationName || '' },
    { label: 'Contact Person:', value: formData.contactPerson || '' },
    { label: 'Industry/Sector:', value: formData.industry || '' },
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

  // Cybersecurity Assessment
  addNewPageIfNeeded(20);
  page.drawText('CYBERSECURITY ASSESSMENT', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const securityQuestions = [
    'Is your network protected by a firewall?',
    'Are network devices secured with encryption and strong passwords?',
    'Do you use segmentation to separate sensitive traffic?',
    'Is your wireless network secured with WPA3 or WPA2 encryption?',
    'Do you have antivirus and endpoint protection on all devices?',
    'Are all software and systems regularly updated with security patches?',
    'Are you using multi-factor authentication (MFA) for sensitive systems?',
    'Do you have a system to monitor your network for unusual activity?',
    'How quickly can you detect and respond to security incidents?',
    'Would you benefit from 24/7 network and endpoint monitoring?',
    'Do you have an incident response plan in place?',
    'Are employees trained on cybersecurity incident response?',
    'Have you conducted a recent vulnerability assessment?',
    'Are you using a Security Information and Event Management (SIEM) tool?',
    'Do you need help meeting compliance requirements?',
    'Would you be interested in FortiSIEM as a service?',
    'Do you have a data backup and disaster recovery plan?',
    'Is your sensitive data encrypted (both in transit and at rest)?',
    'Do you require help in securing your remote workforce (VPN, Endpoint Security)?',
  ];

  securityQuestions.forEach((question, index) => {
    addNewPageIfNeeded(35);
    const questionText = `${index + 1}. ${question}`;
    const questionLines = wrapTextToFitLine(questionText, helvetica, 10, width - 100);
    let currentY = y;
    questionLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= questionLines.count * 14;

    const value = formData[`q${index}`] ? formData[`q${index}`].charAt(0).toUpperCase() + formData[`q${index}`].slice(1) : 'N/A';
    const valueLines = wrapTextToFitLine(value, helvetica, 10, width - 100);
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
  page.drawText(formData.seatecRepName || 'N/A', { x: 100, y, size: 12, font: helvetica, color: primaryBlue });
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