// app/admin/create-prize/page.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreatePrize() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        prize_name: "",
        description: "",
        prize_value: "",
        draw_time: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("prizes")
                .insert([{
                    prize_name: formData.prize_name,
                    description: formData.description,
                    prize_value: parseFloat(formData.prize_value),
                    draw_time: formData.draw_time
                }]);

            if (error) throw error;

            alert("Prize created successfully!");
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Error creating prize:", error);
            alert("Error creating prize: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-prize">
            <h1>Create New Prize</h1>
            <form onSubmit={handleSubmit} className="prize-form">
                <div className="form-group">
                    <label>Prize Name</label>
                    <input
                        type="text"
                        value={formData.prize_name}
                        onChange={(e) => setFormData({ ...formData, prize_name: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Prize Value ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.prize_value}
                        onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Draw Date & Time</label>
                    <input
                        type="datetime-local"
                        value={formData.draw_time}
                        onChange={(e) => setFormData({ ...formData, draw_time: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? "Creating..." : "Create Prize"}
                </button>
            </form>
        </div>
    );
}