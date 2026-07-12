// Agreement/Contract letter generation for installment payment (PERJANJIAN PEMBIAYAAN DENGAN CARA PEMBELIAN)

export interface AgreementData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNo: string;
  tourName: string;
  tourDestination: string;
  tourDuration: string;
  tourDate: string;
  totalAmount: number;
  downPayment: number;
  dpPercentage: number;
  installmentCount: number;
  amountPerInstallment: number;
  installmentDates: string[];
  agreementDate: string;
  siteUrl: string;
}

export function generateAgreementHtml(data: AgreementData): string {
  const formatCurrency = (n: number) =>
    `Rp ${n.toLocaleString('id-ID')}`;

  const installmentRows = data.installmentDates
    .map(
      (date, i) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${formatCurrency(data.amountPerInstallment)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Perjanjian Pembiayaan - ${data.invoiceNo}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #1a1a1a; background: #f5f5f5; }
  .page { max-width: 210mm; margin: 0 auto; background: #fff; padding: 30px 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
  .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 22px; margin: 0 0 5px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
  .header .subtitle { font-size: 13px; color: #666; }
  .header .doc-id { font-size: 11px; color: #999; margin-top: 8px; }
  .section { margin-bottom: 25px; }
  .section h2 { font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .info-box { background: #fafafa; padding: 15px; border-radius: 4px; border: 1px solid #eee; }
  .info-box h3 { font-size: 11px; color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-box p { font-size: 13px; margin: 3px 0; line-height: 1.5; }
  .info-box .highlight { font-weight: 600; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table th { background: #1a1a1a; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  table td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  table .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #1a1a1a; background: #fafafa; }
  .terms { font-size: 12px; line-height: 1.8; color: #444; }
  .terms ol { padding-left: 20px; }
  .terms li { margin-bottom: 8px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
  .sig-box { text-align: center; }
  .sig-box .sig-label { font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; }
  .sig-box .sig-name { font-size: 13px; font-weight: 700; margin-top: 60px; border-top: 1px solid #1a1a1a; padding-top: 8px; display: inline-block; min-width: 200px; }
  .sig-box .sig-date { font-size: 11px; color: #888; margin-top: 5px; }
  .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #999; text-align: center; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; padding: 20px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <h1>Perjanjian Pembiayaan Dengan Cara Pembelian</h1>
    <div class="subtitle">Surat Perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak pada tanggal ${data.agreementDate}</div>
    <div class="doc-id">No. Referensi: ${data.invoiceNo} — ${data.companyName}</div>
  </div>

  <!-- Para Pihak -->
  <div class="section">
    <h2>Para Pihak</h2>
    <div class="info-grid">
      <div class="info-box">
        <h3>Pihak Pertama (Penjual / Penyedia Jasa)</h3>
        <p class="highlight">${data.companyName}</p>
        <p>${data.companyAddress}</p>
        <p>Telp: ${data.companyPhone}</p>
        <p>Email: ${data.companyEmail}</p>
      </div>
      <div class="info-box">
        <h3>Pihak Kedua (Pembeli / Pelanggan)</h3>
        <p class="highlight">${data.customerName}</p>
        <p>Telp: ${data.customerPhone}</p>
        <p>Email: ${data.customerEmail}</p>
      </div>
    </div>
  </div>

  <!-- Objek Perjanjian -->
  <div class="section">
    <h2>Objek Perjanjian</h2>
    <table>
      <tr><td style="width:180px;color:#888;">Nomor Invoice</td><td><strong>${data.invoiceNo}</strong></td></tr>
      <tr><td style="color:#888;">Nama Paket Tour</td><td><strong>${data.tourName}</strong></td></tr>
      <tr><td style="color:#888;">Destinasi</td><td>${data.tourDestination}</td></tr>
      <tr><td style="color:#888;">Durasi</td><td>${data.tourDuration}</td></tr>
      <tr><td style="color:#888;">Tanggal Keberangkatan</td><td><strong>${data.tourDate}</strong></td></tr>
    </table>
  </div>

  <!-- Rincian Pembiayaan -->
  <div class="section">
    <h2>Rincian Pembiayaan</h2>
    <table>
      <tr><td style="color:#888;">Total Harga Paket</td><td><strong>${formatCurrency(data.totalAmount)}</strong></td></tr>
      <tr><td style="color:#888;">Uang Muka (DP ${data.dpPercentage}%)</td><td><strong>${formatCurrency(data.downPayment)}</strong></td></tr>
      <tr><td style="color:#888;">Sisa Pembayaran</td><td>${formatCurrency(data.totalAmount - data.downPayment)}</td></tr>
      <tr><td style="color:#888;">Jumlah Angsuran</td><td>${data.installmentCount}x</td></tr>
      <tr><td style="color:#888;">Nilai Per Angsuran</td><td><strong>${formatCurrency(data.amountPerInstallment)}</strong></td></tr>
    </table>
  </div>

  <!-- Jadwal Angsuran -->
  <div class="section">
    <h2>Jadwal Pembayaran Angsuran</h2>
    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:60px">Angsuran ke-</th>
          <th>Jumlah</th>
          <th>Jatuh Tempo</th>
        </tr>
      </thead>
      <tbody>
        ${installmentRows}
      </tbody>
    </table>
  </div>

  <!-- Syarat & Ketentuan -->
  <div class="section">
    <h2>Syarat & Ketentuan</h2>
    <div class="terms">
      <ol>
        <li><strong>Kewajiban Pembayaran:</strong> PIHAK KEDUA wajib melakukan pembayaran angsuran sesuai jadwal yang telah disepakati di atas. Keterlambatan pembayaran dapat mengakibatkan pembatalan pesanan.</li>
        <li><strong>Batas Waktu Pembayaran:</strong> Setiap angsuran harus dibayar paling lambat pada tanggal jatuh tempo yang tertera pada jadwal. PIHAK KEDUA wajib mengunggah bukti transfer melalui halaman invoice.</li>
        <li><strong>Konfirmasi Pembayaran:</strong> PIHAK PERTAMA akan mengkonfirmasi setiap pembayaran angsuran dalam waktu 1x24 jam setelah bukti transfer diunggah. Status pembayaran dapat dipantau melalui halaman invoice.</li>
        <li><strong>Pembatalan:</strong> Apabila PIHAK KEDUA tidak melakukan pembayaran angsuran sesuai jadwal selama lebih dari 7 hari setelah jatuh tempo, PIHAK PERTAMA berhak membatalkan pesanan. Uang muka dan angsuran yang telah dibayarkan tidak dapat dikembalikan.</li>
        <li><strong>Pelunasan:</strong> Seluruh angsuran harus dilunasi paling lambat H-7 sebelum tanggal keberangkatan. Apabila belum lunas, PIHAK PERTAMA berhak menunda keberangkatan atau membatalkan pesanan.</li>
        <li><strong>Perubahan Jadwal:</strong> Perubahan jadwal angsuran hanya dapat dilakukan atas persetujuan tertulis dari kedua belah pihak.</li>
        <li><strong>Penyelesaian Perselisihan:</strong> Apabila terjadi perselisihan, kedua belah pihak sepakat untuk menyelesaikannya secara musyawarah dan kekeluargaan.</li>
      </ol>
    </div>
  </div>

  <!-- Tanda Tangan -->
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-label">Pihak Pertama<br><span style="font-weight:400;font-size:11px;">${data.companyName}</span></div>
      <div class="sig-name">_________________</div>
      <div class="sig-date">Tanggal: ${data.agreementDate}</div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Pihak Kedua<br><span style="font-weight:400;font-size:11px;">${data.customerName}</span></div>
      <div class="sig-name">_________________</div>
      <div class="sig-date">Tanggal: ${data.agreementDate}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Dokumen ini diterbitkan secara elektronik oleh ${data.companyName} dan sah tanpa tanda tangan basah.<br>
    ${data.companyName} &bull; ${data.companyPhone} &bull; ${data.companyEmail}<br>
    Diterbitkan: ${data.agreementDate} &bull; Ref: ${data.invoiceNo}
  </div>

</div>
</body>
</html>`;
}

export function generateInstallmentDates(
  installmentCount: number,
  downPaymentPct: number,
  total: number
): {
  downPayment: number;
  amountPerInstallment: number;
  dates: string[];
} {
  const now = new Date();
  const downPayment = Math.round(total * (downPaymentPct / 100));

  // DP due immediately (same day)
  const remainingTotal = total - downPayment;
  const amountPerInstallment = Math.round(remainingTotal / installmentCount);

  const dates: string[] = [];
  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(now);
    // Each installment is 30 days apart starting next month
    dueDate.setMonth(now.getMonth() + i + 1);
    dates.push(dueDate.toISOString());
  }

  return { downPayment, amountPerInstallment, dates };
}
