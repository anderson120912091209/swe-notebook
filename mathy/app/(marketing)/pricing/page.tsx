export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Pricing Plans
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Choose the perfect plan for your learning journey
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">Basic</h3>
              <p className="text-3xl font-bold mb-6">$9<span className="text-lg text-gray-600">/month</span></p>
              <ul className="text-left space-y-3 mb-8">
                <li>✓ Access to basic courses</li>
                <li>✓ Practice problems</li>
                <li>✓ Progress tracking</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
            
            <div className="border-2 border-blue-600 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                Popular
              </div>
              <h3 className="text-2xl font-semibold mb-4">Pro</h3>
              <p className="text-3xl font-bold mb-6">$19<span className="text-lg text-gray-600">/month</span></p>
              <ul className="text-left space-y-3 mb-8">
                <li>✓ All Basic features</li>
                <li>✓ Advanced courses</li>
                <li>✓ 1-on-1 tutoring</li>
                <li>✓ Certificates</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">Premium</h3>
              <p className="text-3xl font-bold mb-6">$39<span className="text-lg text-gray-600">/month</span></p>
              <ul className="text-left space-y-3 mb-8">
                <li>✓ All Pro features</li>
                <li>✓ Unlimited tutoring</li>
                <li>✓ Custom learning paths</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}