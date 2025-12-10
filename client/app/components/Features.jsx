export default function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-blue-100 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Custom Paths</h3>
          <p>Select your field and level for tailored questions.</p>
        </div>
        <div className="p-6 bg-blue-100 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
          <p>AI reviews answers, giving you focused suggestions.</p>
        </div>
        <div className="p-6 bg-blue-100 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">Flexible Practice</h3>
          <p>Technical, behavioral, or mock voice interviews, all in one place.</p>
        </div>
      </div>
    </section>
  )
}
