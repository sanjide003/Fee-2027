// ============================================================
// js/receipt-generator.js
// PDF Receipt generation — extracted from collection.html
// Depends on: jsPDF (loaded via CDN in HTML)
// ============================================================

// ── Generate & Print Receipt ───────────────────────────────────
// paymentData  — { student, items, receiptNo, date, totalAmount,
//                  collectedByName, description }
// institutionData — { appName, appSubtitle, contactPhone,
//                     contactEmail, regNo, place, logoUrl }
export async function printReceipt(paymentData, institutionData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

    const pW = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentW = pW - margin * 2;

    // ── Colors ──────────────────────────────────────────────────
    const primary = [15, 23, 42];       // #0f172a
    const accent  = [59, 130, 246];     // #3b82f6
    const green   = [16, 185, 129];     // #10b981
    const gray    = [100, 116, 139];    // #64748b
    const lightBg = [248, 250, 252];    // #f8fafc

    let y = 0;

    // ── Header Band ──────────────────────────────────────────────
    doc.setFillColor(...accent);
    doc.rect(0, 0, pW, 28, 'F');

    // Logo (if URL — attempt fetch as base64)
    if (institutionData.logoUrl) {
        try {
            const img = await urlToBase64(institutionData.logoUrl);
            doc.addImage(img, 'PNG', margin, 4, 20, 20);
        } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(institutionData.appName || 'Institution', pW / 2, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 255);
    const subParts = [institutionData.appSubtitle, institutionData.place, institutionData.regNo ? `Reg: ${institutionData.regNo}` : ''].filter(Boolean);
    doc.text(subParts.join('  |  '), pW / 2, 17, { align: 'center' });

    if (institutionData.contactPhone) {
        doc.text(`📞 ${institutionData.contactPhone}`, pW / 2, 24, { align: 'center' });
    }

    y = 34;

    // ── Receipt Title ────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primary);
    doc.text('FEE RECEIPT', pW / 2, y, { align: 'center' });
    y += 2;

    doc.setDrawColor(...accent);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pW - margin, y);
    y += 5;

    // ── Receipt No & Date ─────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text(`Receipt No: ${paymentData.receiptNo || 'N/A'}`, margin, y);
    doc.text(`Date: ${formatReceiptDate(paymentData.date)}`, pW - margin, y, { align: 'right' });
    y += 8;

    // ── Student Info Box ─────────────────────────────────────────
    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 26, 2, 2, 'FD');
    y += 5;

    const st = paymentData.student;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(st.name || '-', margin + 4, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);

    const col1 = `Class: ${st.class || '-'}    Adm No: ${st.adm || '-'}`;
    const col2 = st.gender ? `Gender: ${st.gender}` : '';
    doc.text(col1, margin + 4, y);
    if (col2) doc.text(col2, pW - margin - 4, y, { align: 'right' });
    y += 5;

    if (st.father) {
        doc.text(`Father: ${st.father}`, margin + 4, y);
        y += 5;
    }
    y += 4;

    // ── Fee Items Table ──────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setFillColor(...accent);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.text('Fee Description', margin + 3, y + 5);
    doc.text('Amount', pW - margin - 3, y + 5, { align: 'right' });
    y += 9;

    let totalAmt = 0;
    const items = paymentData.items || [];

    items.forEach((item, idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 2, contentW, 7, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...primary);
        doc.text(item.name, margin + 3, y + 3);
        doc.text(`₹${Number(item.amount).toFixed(0)}`, pW - margin - 3, y + 3, { align: 'right' });
        totalAmt += Number(item.amount) || 0;
        y += 7;
    });

    // Total row
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pW - margin, y);
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...green);
    doc.text('TOTAL PAID', margin + 3, y + 4);
    doc.text(`₹${Number(paymentData.totalAmount || totalAmt).toFixed(0)}`, pW - margin - 3, y + 4, { align: 'right' });
    y += 10;

    // Description / Remarks
    if (paymentData.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(`Remarks: ${paymentData.description}`, margin, y);
        y += 6;
    }

    // ── Collected By ─────────────────────────────────────────────
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pW - margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(`Collected By: ${paymentData.collectedByName || 'Staff'}`, margin, y);
    doc.text('Authorised Signature', pW - margin, y, { align: 'right' });
    y += 10;

    // ── Footer Note ───────────────────────────────────────────────
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...gray);
    doc.text('This is a computer-generated receipt and does not require a physical signature.', pW / 2, y, { align: 'center' });

    // ── Open print dialog ─────────────────────────────────────────
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
}

// ── Generate Fee Status PDF (class-wise full table) ────────────
// students   — filtered student array
// feeItems   — all fee item definitions
// allPayments — all payment records
// filterLabel — string for title
export function generateFeeStatusPDF(students, feeItems, allPayments, filterLabel = '') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

    const visibleItems = feeItems.filter(i => i.isVisible !== false);
    const headers = ['#', 'Student', 'Adm No', 'Class', ...visibleItems.map(i => i.name)];

    const body = students.map((s, idx) => {
        const cols = [
            idx + 1,
            s.name,
            s.adm || '-',
            s.class
        ];
        visibleItems.forEach(item => {
            const paid = allPayments.some(p => p.studentId === s.id && p.itemKey === item.key);
            cols.push(paid ? '✓' : '—');
        });
        return cols;
    });

    doc.autoTable({
        head: [headers],
        body,
        startY: 18,
        margin: { left: 8, right: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (data) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Fee Status Report${filterLabel ? ' — ' + filterLabel : ''}`, 8, 12);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date().toLocaleDateString('en-GB'), doc.internal.pageSize.getWidth() - 8, 12, { align: 'right' });
        }
    });

    doc.save(`Fee_Status_${filterLabel || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Utility: Convert image URL → base64 ───────────────────────
async function urlToBase64(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ── Utility: Format date for receipt ──────────────────────────
function formatReceiptDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}
