export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Getting Started Guide
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Learn how to make the most of your Mathy experience
          </p>
          
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Choose Your Learning Path
              </h2>
              <p className="text-gray-600 mb-4">
                Start by selecting the math topics that interest you most. Our adaptive learning system will create a personalized curriculum based on your goals and current skill level.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  💡 <strong>Tip:</strong> Take our placement test to get accurate recommendations for your starting point.
                </p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Practice Regularly
              </h2>
              <p className="text-gray-600 mb-4">
                Consistency is key to mastering mathematics. Set aside time each day for practice, even if it's just 15-20 minutes.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Complete daily practice problems</li>
                <li>Review concepts you've learned</li>
                <li>Take regular quizzes to test your understanding</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Track Your Progress
              </h2>
              <p className="text-gray-600 mb-4">
                Monitor your improvement with our comprehensive progress tracking tools. See your strengths, identify areas for improvement, and celebrate your achievements.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Get Help When Needed
              </h2>
              <p className="text-gray-600 mb-4">
                Don't hesitate to reach out for help. Our tutoring system and community support are here to help you succeed.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}