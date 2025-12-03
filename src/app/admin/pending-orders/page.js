// app/admin/pending-orders/page.js - SECURED VERSION
// Uses API routes instead of direct database access
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function PendingOrdersPage() {
    const { userId, isLoaded } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isLoaded && userId) {
            checkAdminAndFetchOrders();
        }
    }, [isLoaded, userId]);

    const checkAdminAndFetchOrders = async () => {
        try {
            // Check admin status via secure API
            const verifyRes = await fetch('/api/admin/verify');
            const verifyData = await verifyRes.json();

            if (!verifyData.isAdmin) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            setIsAdmin(true);

            // Fetch orders via secure API (now protected with auth)
            const ordersRes = await fetch('/api/admin/orders');

            if (!ordersRes.ok) {
                throw new Error('Failed to fetch orders');
            }

            const ordersData = await ordersRes.json();
            setOrders(ordersData || []);
        } catch (err) {
            console.error("Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmOrder = async (orderId, clerkId, tickets) => {
        if (!confirm("Mark this order as paid and add tickets to user?")) return;

        try {
            // Use secured API route instead of direct database access
            const res = await fetch('/api/admin/confirm-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, clerkId, tickets })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to confirm order');
            }

            alert(`✅ ${data.message}`);
            checkAdminAndFetchOrders(); // Refresh list
        } catch (err) {
            console.error("Error confirming order:", err);
            alert(`Failed to confirm order: ${err.message}`);
        }
    };

    const cancelOrder = async (orderId) => {
        if (!confirm("Cancel this pending order?")) return;

        try {
            // Use secured API route
            const res = await fetch('/api/admin/cancel-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            if (!res.ok) {
                throw new Error('Failed to cancel order');
            }

            alert("Order cancelled");
            checkAdminAndFetchOrders();
        } catch (err) {
            console.error("Error cancelling order:", err);
            alert(`Failed to cancel order: ${err.message}`);
        }
    };

    if (!isLoaded || loading) {
        return <div className="container">Loading...</div>;
    }

    if (!isAdmin) {
        return <div className="container">Access denied. Admin privileges required.</div>;
    }

    if (error) {
        return <div className="container">Error: {error}</div>;
    }

    return (
        <div className="container">
            <h1>Pending E-Transfer Orders</h1>
            <p>Total: {orders.length} orders</p>

            <div className="orders-grid">
                {orders.map((order) => (
                    <div key={order.id} className="order-card">
                        <h3>Order #{order.id.slice(0, 8)}</h3>
                        <p><strong>User:</strong> {order.clerk_id?.slice(0, 12)}...</p>
                        <p><strong>Email:</strong> {order.user_email}</p>
                        <p><strong>Amount:</strong> ${order.total_amount}</p>
                        <p><strong>Tickets:</strong> {order.total_tickets}</p>
                        <p><strong>Status:</strong> {order.status}</p>
                        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>

                        <div className="order-actions">
                            {order.status === "pending" && (
                                <>
                                    <button onClick={() => confirmOrder(order.id, order.clerk_id, order.total_tickets)}>
                                        Confirm Payment
                                    </button>
                                    <button onClick={() => cancelOrder(order.id)} className="cancel">
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
