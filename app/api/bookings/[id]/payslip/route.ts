import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { Booking, TourPackage, User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";
import { formatBdt } from "@/lib/tour-package";
import { formatTravelDate } from "@/lib/booking";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    await DbConnect();

    const booking = await Booking.findById(id);
    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    if (auth.role !== "admin" && String(booking.userId) !== String(auth.userId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const [pkg, user] = await Promise.all([
      TourPackage.findById(booking.packageId),
      User.findById(booking.userId),
    ]);

    const customerName = user?.name || "Valued Traveler";
    const customerEmail = user?.email || "N/A";
    const customerPhone = booking.contactPhone || "N/A";
    const packageName = pkg?.title || "Custom Tour Package";
    const location = pkg?.location || "Bangladesh";
    const duration = pkg?.duration || "N/A";

    const payslipNo = `PAY-${booking.id}-${new Date(booking.createdAt).getFullYear()}`;
    const dateIssued = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const isPaid = booking.paymentStatus === "paid";
    const isConfirmed = booking.status === "confirmed" || booking.status === "completed";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - Booking #${booking.id} - ExploreBD Tours</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4fbf8;
      color: #0f172a;
      line-height: 1.5;
      padding: 20px;
    }
    .print-actions {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: justify-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
    }
    .btn-primary { background: #0f766e; color: #ffffff; }
    .btn-primary:hover { background: #115e59; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 20px;
      border: 1px solid #ccfbf1;
      box-shadow: 0 10px 25px rgba(15, 118, 110, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .doc-title {
      text-align: right;
    }
    .doc-title h2 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-title p {
      font-size: 12px;
      color: #0f766e;
      font-weight: 700;
      margin-top: 2px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #f8fafc;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .card-body p {
      font-size: 13px;
      color: #334155;
      margin-bottom: 4px;
    }
    .card-body p strong {
      color: #0f172a;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .table th {
      background: #0f766e;
      color: #ffffff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      text-align: left;
    }
    .table td {
      padding: 12px 14px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }
    .table tr:nth-child(even) {
      background: #f8fafc;
    }

    .summary-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .stamp {
      display: inline-block;
      padding: 6px 16px;
      border: 2px dashed #16a34a;
      color: #15803d;
      font-weight: 800;
      font-size: 14px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transform: rotate(-3deg);
    }
    .total-amount {
      text-align: right;
    }
    .total-amount span {
      font-size: 12px;
      color: #64748b;
      display: block;
    }
    .total-amount h3 {
      font-size: 24px;
      color: #0f766e;
      font-weight: 800;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .print-actions { display: none; }
      .container { border: none; shadow: none; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="print-actions">
    <div>
      <strong style="color:#0f766e; font-size:14px;">ExploreBD Tours Official Payslip</strong>
    </div>
    <div style="display:flex; gap:10px;">
      <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save PDF</button>
      <button onclick="window.close()" class="btn btn-secondary">Close</button>
    </div>
  </div>

  <div class="container">
    <div class="header">
      <div>
        <h1 class="brand-title">ExploreBD Tours</h1>
        <p class="brand-sub">Gulshan Avenue, Dhaka 1212 · hello@explorebdtours.com · +880 1700-123456</p>
      </div>
      <div class="doc-title">
        <h2>Official Payslip</h2>
        <p>${payslipNo}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="card">
        <div class="card-title">Customer Information</div>
        <div class="card-body">
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Payslip Details</div>
        <div class="card-body">
          <p><strong>Date Issued:</strong> ${dateIssued}</p>
          <p><strong>Booking Ref:</strong> #${booking.id}</p>
          <p><strong>Trip Status:</strong> <span style="color:#0f766e; font-weight:700;">${booking.status.toUpperCase()}</span></p>
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Item / Service</th>
          <th>Location</th>
          <th>Travel Date</th>
          <th>Travelers</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${packageName}</strong><br><small style="color:#64748b;">${duration}</small></td>
          <td>${location}</td>
          <td>${formatTravelDate(booking.travelDate instanceof Date ? booking.travelDate.toISOString() : String(booking.travelDate))}</td>
          <td>${booking.travelers} Guest(s)</td>
        </tr>
      </tbody>
    </table>

    <table class="table">
      <thead>
        <tr>
          <th>Payment Method</th>
          <th>Transaction Reference</th>
          <th>Payment Status</th>
          <th style="text-align:right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${booking.paymentMethod || "Direct Payment / Online"}</td>
          <td>${booking.transactionId || `TXN-${booking.id}-BD`}</td>
          <td><strong style="color:${isPaid ? '#15803d' : '#0f766e'};">${booking.paymentStatus.toUpperCase()}</strong></td>
          <td style="text-align:right;"><strong>${formatBdt(booking.totalPriceBdt)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="summary-box">
      <div class="stamp">
        ${isConfirmed || isPaid ? "✓ CONFIRMED & PAID" : "PENDING REVIEW"}
      </div>
      <div class="total-amount">
        <span>Total Paid Amount:</span>
        <h3>${formatBdt(booking.totalPriceBdt)}</h3>
      </div>
    </div>

    ${booking.travelerNames && booking.travelerNames.length ? `
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-title">Traveler Roster</div>
        <div class="card-body">
          <p>${booking.travelerNames.join(", ")}</p>
        </div>
      </div>
    ` : ""}

    <div class="footer">
      <p>Thank you for traveling with ExploreBD Tours!</p>
      <p style="margin-top:4px;">This document is an official computer-generated receipt. No signature required.</p>
    </div>
  </div>

</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("GET payslip error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
