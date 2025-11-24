export default function Footer() {
    return (
        <footer className="footer">

            <div className="bubbles">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="bubble"
                        style={{
                            "--size": `${2 + Math.random() * 4}rem`,
                            "--distance": `${20 + Math.random() * 80}vh`,
                            "--position": `${Math.random() * 100}%`,
                            "--time": `${6 + Math.random() * 4}s`,
                            "--delay": `${Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            <div className="py-8 text-center text-black">
                © {new Date().getFullYear()} DPino Contests — All Rights Reserved
            </div>

        </footer>
    );
}
