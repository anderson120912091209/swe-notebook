'use client';

import { useNamespaceTranslation } from "../../lib/i18n/LanguageContext";

export default function GuidePage() {
  const { t: tMarketing } = useNamespaceTranslation('marketing');
  
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {tMarketing('guideTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            {tMarketing('guideSubtitle')}
          </p>
          
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {tMarketing('guideStep1Title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tMarketing('guideStep1Description')}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  {tMarketing('guideStep1Tip')}
                </p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {tMarketing('guideStep2Title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tMarketing('guideStep2Description')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{tMarketing('guideStep2List1')}</li>
                <li>{tMarketing('guideStep2List2')}</li>
                <li>{tMarketing('guideStep2List3')}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {tMarketing('guideStep3Title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tMarketing('guideStep3Description')}
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {tMarketing('guideStep4Title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tMarketing('guideStep4Description')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}