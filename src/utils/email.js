// utils/email.js (optional)
export async function sendEtransferEmail(toEmail, userId, amount, orderId) {
    // Using Resend for email sending
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'DPino Contests <noreply@darkpino.xyz>',
            to: [toEmail],
            subject: 'DPino E-Transfer Instructions',
            html: `
                <h2>DPino E-Transfer Payment Instructions</h2>
                <p>Thank you for your order! Here are your payment instructions:</p>
                <ul>
                    <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
                    <li><strong>Send to:</strong> etransfer@darkpino.xyz</li>
                    <li><strong>User ID:</strong> ${userId}</li>
                    <li><strong>Order ID:</strong> ${orderId}</li>
                </ul>
                <p><strong>IMPORTANT:</strong> Include your User ID in the E-Transfer message.</p>
                <p>Once payment is confirmed, your tickets will be added to your account.</p>
                <hr>
                <p>Questions? Contact us at contest@darkpino.xyz</p>
            `
        })
    });

    return res.ok;
}