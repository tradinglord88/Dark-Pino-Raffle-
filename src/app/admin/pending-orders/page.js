// app/admin/pending-orders/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default function PendingOrdersPage() {
    const { userId } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminStatus();
        fetchOrders();
    }, []);

    const checkAdminStatus = async () => {
        // Check if user is admin (you can store admin IDs in environment variables)
        const adminIds = process.env.NEXT_PUBLIC_ADMIN_IDS?.split(",") || [];
        setIsAdmin(adminIds.includes(userId));
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabaseAdmin
                .from("pending_orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const confirmOrder = async (orderId) => {
        if (!confirm("Mark this order as paid and add tickets to user?")) return;

        try {
            const { data: order } = await supabaseAdmin
                .from("pending_orders")
                .select("*")
                .eq("id", orderId)
                .single();

            // Add tickets to user
            const { data: user } = await supabaseAdmin
                .from("users")
                .select("tickets")
                .eq("clerk_id", order.clerk_id)
                .single();

            const newTickets = (user?.tickets || 0) + order.total_tickets;

            await supabaseAdmin
                .from("users")
                .update({ tickets: newTickets })
                .eq("clerk_id", order.clerk_id);

            // Update order status
            await supabaseAdmin
                .from("pending_orders")
                .update({
                    status: "confirmed",
                    confirmed_at: new Date().toISOString(),
                    confirmed_by: userId
                })
                .eq("id", orderId);

            alert(`✅ Order confirmed! ${order.total_tickets} tickets added to user.`);
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error("Error confirming order:", error);
            alert("Failed to confirm order");
        }
    };

    const cancelOrder = async (orderId) => {
        if (!confirm("Cancel this pending order?")) return;

        try {
            await supabaseAdmin
                .from("pending_orders")
                .update({ status: "cancelled" })
                .eq("id", orderId);

            alert("Order cancelled");
            fetchOrders();
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert("Failed to cancel order");
        }
    };

    if (!isAdmin) {
        return <div className="container">Access denied.</div>;
    }

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <h1>Pending E-Transfer Orders</h1>
            <p>Total: {orders.length} orders</p>

            <div className="orders-grid">
                {orders.map((order) => (
                    <div key={order.id} className="order-card">
                        <h3>Order #{order.id.slice(0, 8)}</h3>
                        <p><strong>User:</strong> {order.clerk_id}</p>
                        <p><strong>Email:</strong> {order.user_email}</p>
                        <p><strong>Amount:</strong> ${order.total_amount}</p>
                        <p><strong>Tickets:</strong> {order.total_tickets}</p>
                        <p><strong>Status:</strong> {order.status}</p>
                        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>

                        <div className="order-actions">
                            {order.status === "pending" && (
                                <>
                                    <button onClick={() => confirmOrder(order.id)}>
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