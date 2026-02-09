import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function editPdf(inputPath, outputPath, texts) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Example: Modify the first page's text by overlaying new text
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  texts.forEach(text => {
    firstPage.drawText(text.text, {
        x: text.xPos,
        y: text.yPos,
        size: text.textSize,
        font: helveticaFont,
        color: rgb(0.925490196, 0.949019608, 0.97254902)
    });
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

const time = new Date();

export function getInvoicePdf(orderData) {
    editPdf("invoices/template.pdf", `invoices/invoice-${orderData.orderId}.pdf`, [
        {
            text: `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`,
            xPos: 460,
            yPos: 735,
            textSize: 15
        },
        {
            text: `${orderData.orderName}`,
            xPos: 220,
            yPos: 642,
            textSize: 15
        },
        {
            text: `${orderData.orderEmail}`,
            xPos: 248,
            yPos: 596,
            textSize: 15
        },
        {
            text: `${orderData.orderAddress}, ${orderData.orderCity}, ${orderData.orderState}, ${orderData.orderCountry}`,
            xPos: 266,
            yPos: 549,
            textSize: 15
        },
        // Order table
        {
            text: `${"U Brush PRO"}`,
            xPos: 188,
            yPos: 378,
            textSize: 15
        },
        {
            text: `${orderData.orderQuantity}`,
            xPos: 378,
            yPos: 378,
            textSize: 15
        },
        {
            text: `${"$35"}`,
            xPos: 463,
            yPos: 378,
            textSize: 15
        },
        {
            text: `$${35 * parseInt(orderData.orderQuantity)}`,
            xPos: 463,
            yPos: 352,
            textSize: 15
        },
        {
            text: `$${Math.floor((35 * parseInt(orderData.orderQuantity) * 0.029 + 0.30) * 100) / 100}`,
            xPos: 463,
            yPos: 325,
            textSize: 15
        },
        {
            text: `$${Math.floor((35 * parseInt(orderData.orderQuantity) * 1.029 + 0.30) * 100) / 100}`,
            xPos: 463,
            yPos: 298,
            textSize: 15
        }
    ]);

    console.log("Order invoice created")
}

export function deleteInvoice(invoiceId) {
    fs.unlink(`invoices/invoice-${invoiceId}.pdf`, (err) => {
        if (err) {
            console.error('Error deleting invoice:', err);
            return;
        }
        console.log('Order invoice deleted');
    });
}