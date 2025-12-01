// app/admin/page.js - FIXED WITH CLIENT-SIDE VERIFICATION
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
    const { userId, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [orders, setOrders] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        if (!userId) {
            // Not signed in at all
            router.push("/sign-in");
            return;
        }

        // CRITICAL: Verify admin status client-side
        const verifyAdmin = async () => {
            try {
                const res = await fetch(`/api/admin/verify?userId=${userId}`);
                const data = await res.json();

                if (!data.isAdmin) {
                    console.log("🚫 Client-side check: Not an admin, redirecting");
                    router.push("/");
                    return;
                }

                setIsAdmin(true);
                fetchOrders();
            } catch (error) {
                console.error("Admin verification error:", error);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        verifyAdmin();
    }, [isLoaded, userId, router]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders");
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const confirmOrder = async (orderId, clerkId, tickets) => {
        if (!confirm(`Add ${tickets} tickets to user?`)) return;

        try {
            const res = await fetch("/api/admin/confirm-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, clerkId, tickets })
            });

            const data = await res.json();

            if (data.success) {
                alert("✅ Tickets added successfully!");
                fetchOrders(); // Refresh
            } else {
                alert("❌ Error: " + data.error);
            }
        } catch (error) {
            alert("Error confirming order");
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <h2>Checking admin permissions...</h2>
            </div>
        );
    }

    if (!isAdmin) {
        // This will briefly show before redirect happens
        return (
            <div className="admin-loading">
                <h2>Redirecting...</h2>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <button
                    onClick={() => router.push("/")}
                    className="back-button"
                >
                    ← Back to Site
                </button>
            </header>

            <div className="admin-stats">
                <div className="stat-card">
                    <h3>Total Orders</h3>
                    <p>{orders.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Pending</h3>
                    <p>{orders.filter(o => o.status === "pending").length}</p>
                </div>
                <div className="stat-card">
                    <h3>Confirmed</h3>
                    <p>{orders.filter(o => o.status === "confirmed").length}</p>
                </div>
            </div>

            <h2>Pending E-Transfer Orders</h2>

            {orders.length === 0 ? (
                <p>No pending orders</p>
            ) : (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>User ID</th>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Tickets</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.id.slice(0, 8)}...</td>
                                    <td>{order.clerk_id.slice(0, 10)}...</td>
                                    <td>{order.user_email}</td>
                                    <td>${order.total_amount}</td>
                                    <td>{order.total_tickets}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge status-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.status === "pending" && (
                                            <button
                                                onClick={() => confirmOrder(order.id, order.clerk_id, order.total_tickets)}
                                                className="confirm-btn"
                                            >
                                                ✓ Confirm
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: "40px", textAlign: "center" }}>
                <p>User ID: {userId}</p>
                <p>Admin Status: ✅ Verified</p>
            </div>
        </div>
    );
}