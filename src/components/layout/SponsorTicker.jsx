const sponsorSlots = [
  { id: 'sponsor-01', label: 'Logo sponsor 01' },
  { id: 'sponsor-02', label: 'Logo sponsor 02' },
  { id: 'sponsor-03', label: 'Logo sponsor 03' },
  { id: 'sponsor-04', label: 'Logo sponsor 04' },
]

export default function SponsorTicker() {
  return (
    <footer className="sponsor-ticker" aria-label="Sponsor del Memorial">
      <span className="sponsor-ticker-label">
        <span className="sponsor-ticker-live-dot" aria-hidden="true" />
        Sponsor
      </span>

      <div className="sponsor-ticker-window" aria-label="Segnaposto loghi sponsor">
        <div className="sponsor-ticker-track">
          {[0, 1].map((copy) => (
            <div className="sponsor-ticker-sequence" key={copy}>
              {sponsorSlots.map((sponsor) => (
                <span className="sponsor-logo-placeholder" key={sponsor.id}>
                  <span className="sponsor-logo-placeholder-mark" aria-hidden="true">+</span>
                  {sponsor.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <span className="sponsor-ticker-signature" aria-hidden="true">
        MR <span>2026</span>
      </span>
      <span className="visually-hidden">
        Segnaposto per i loghi degli sponsor del Memorial Alessio Rizzo.
      </span>
    </footer>
  )
}