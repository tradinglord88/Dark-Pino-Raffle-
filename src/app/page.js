export default function HomePage() {
  return (
    <main>


      <section className="hero-section"></section>

      <section className="quick-start">
        <div className="desc">
          <h1>Quick Entries</h1>
          <p>Skip the Shopping and Instantly get Entered.</p>
        </div>

        <div className="container-1">
          <div className="card">
            <img src="/Image/entry1.png" alt="Entry" />
            <div className="card-text">🎟 100,000 Entries <span>100x</span></div>
          </div>

          <div className="card">
            <img src="/Image/entry2.png" alt="Entry" />
            <div className="card-text">🎟 100,000 Entries <span>100x</span></div>
          </div>

          <div className="card">
            <img src="/Image/entry3.png" alt="Entry" />
            <div className="card-text">🎟 100,000 Entries <span>100x</span></div>
          </div>
        </div>
      </section>

    </main>
  );
}
