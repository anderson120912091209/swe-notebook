export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to Mathy
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your interactive math learning platform. Master mathematics with our innovative approach to learning.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Add some content to demonstrate scrolling */}
        <div className="mt-32 space-y-16">
          <section className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Interactive Lessons</h3>
                <p className="text-gray-600">Learn with hands-on interactive math problems</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Progress Tracking</h3>
                <p className="text-gray-600">Monitor your learning progress in real-time</p>
              </div>
              <div className="p-6 border border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Expert Support</h3>
                <p className="text-gray-600">Get help from qualified math tutors</p>
              </div>
            </div>
          </section>
          
          <section className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Mathy?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Our platform combines the latest in educational technology with proven teaching methods 
              to help you master mathematics at your own pace.
            </p>
          </section>
          
          <section className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Start?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of students already learning with Mathy
            </p>
            <button className="bg-blue-600 text-white px-12 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-lg">
              Start Your Journey
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}