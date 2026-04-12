// utils/pdfGenerator.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateInvestmentReceipt = async (transaction) => {
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1E293B; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .title { color: #4F46E5; font-size: 28px; margin: 0; }
          .details { margin-top: 40px; line-height: 1.6; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #F1F5F9; padding-bottom: 5px; }
          .label { font-weight: bold; color: #64748B; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94A3B8; }
          .stamp { color: #10B981; font-weight: bold; border: 3px solid #10B981; display: inline-block; padding: 5px 15px; transform: rotate(-5deg); margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">BusinessConnect</h1>
          <p>Official Investment Receipt</p>
        </div>
        
        <div class="details">
          <div class="row"><span class="label">Transaction ID:</span> <span>${transaction.id}</span></div>
          <div class="row"><span class="label">Date:</span> <span>${new Date().toLocaleDateString()}</span></div>
          <div class="row"><span class="label">Investor:</span> <span>${transaction.investorEmail}</span></div>
          <div class="row"><span class="label">Project Name:</span> <span>${transaction.pitchTitle}</span></div>
          <div class="row"><span class="label">Investment Amount:</span> <span style="font-size: 20px; font-weight: bold;">$${transaction.amount.toLocaleString()}</span></div>
        </div>

        <center><div class="stamp">VERIFIED TRANSACTION</div></center>

        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>BusinessConnect Platform © 2026</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error("PDF Error:", error);
  }
};