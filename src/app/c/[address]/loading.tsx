const STEPS = ["Pulling the bytecode", "Making the incision", "Naming every organ", "Checking for poison"];

export default function Loading() {
  return (
    <main className="wrap">
      <div className="operating">
        <div className="slab">
          <span className="half l" />
          <span className="half r" />
          <span className="line" />
        </div>
        <p className="label">Operating…</p>
        <ul>
          {STEPS.map((s, i) => (
            <li key={s} style={{ animationDelay: `${i * 0.6}s` }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
