// src/utils/specialOffers.js
export function calculateSpecialOfferPricing(cart) {
    let updatedCart = [];
    let total = 0;
    let totalTickets = 0;

    cart.forEach(item => {
        if (item.specialOffer && item.offerType === "buy10get2") {
            const quantity = item.qty;

            // Calculate how many complete sets of 12 (10 paid + 2 free)
            const setsOf12 = Math.floor(quantity / 12);
            const remainingItems = quantity % 12;

            // For remaining items, anything beyond 10 is free
            const paidInRemaining = Math.min(remainingItems, 10);
            const freeInRemaining = Math.max(remainingItems - 10, 0);

            // Total paid items = (sets * 10) + paid in remaining
            const totalPaid = (setsOf12 * 10) + paidInRemaining;
            const totalFree = (setsOf12 * 2) + freeInRemaining;

            // Calculate subtotal (only paid items count)
            const subtotal = item.price * totalPaid;

            // Calculate tickets (only paid items earn tickets - 10 tickets per $100)
            const tickets = Math.floor((item.price * totalPaid) / 100) * 10;

            updatedCart.push({
                ...item,
                paidQuantity: totalPaid,
                freeQuantity: totalFree,
                subtotal: subtotal,
                totalTickets: tickets,
                originalQuantity: quantity
            });

            total += subtotal;
            totalTickets += tickets;

        } else {
            // Regular item - no special offer
            const subtotal = item.price * item.qty;
            const tickets = Math.floor(subtotal / 100); // Regular tickets (1 per $100)

            updatedCart.push({
                ...item,
                paidQuantity: item.qty,
                freeQuantity: 0,
                subtotal: subtotal,
                totalTickets: tickets,
                originalQuantity: item.qty
            });

            total += subtotal;
            totalTickets += tickets;
        }
    });

    return {
        cart: updatedCart,
        total: total,
        totalTickets: totalTickets
    };
}