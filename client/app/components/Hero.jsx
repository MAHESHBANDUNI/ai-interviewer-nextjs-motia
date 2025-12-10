export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20 bg-blue-50">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">
        Practice Interviews with AI
      </h1>
      <p className="max-w-lg mb-6 text-gray-700">
        Personalized interview questions, instant AI feedback, and preparation for both technical and behavioral rounds.
      </p>
      <a href="/auth/signin" className="bg-blue-600 text-white py-2 px-6 rounded shadow hover:bg-blue-700">Get Started</a>
    </section>
  )
}
