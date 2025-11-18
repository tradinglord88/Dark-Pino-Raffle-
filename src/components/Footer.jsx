// src/components/Footer.jsx
export default function Footer() {
    return (
        <footer className="w-full py-6 text-center text-white bg-black border-t border-gray-700 mt-10">
            <p className="text-sm opacity-70">
                © {new Date().getFullYear()} DPino Contests — All Rights Reserved
            </p>
        </footer>
    );
}
