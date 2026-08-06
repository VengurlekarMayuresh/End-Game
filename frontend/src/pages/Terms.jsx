import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-3xl border border-border shadow-sm">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using HireSense AI, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p>
              HireSense AI provides users with access to a rich collection of resources for recruitment automation, including but not limited to 
              AI resume ranking, aptitude testing, coding platforms, and interview scheduling workflows.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Conduct</h2>
            <p>
              You understand that all information, data, text, software, music, sound, photographs, graphics, video, messages or other materials, 
              whether publicly posted or privately transmitted, are the sole responsibility of the person from which such content originated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Privacy Policy</h2>
            <p>
              Registration data and certain other information about you is subject to our Privacy Policy. For more information, see our full privacy policy.
              We prioritize the security of your data and use industry-standard encryption for all sensitive information.
            </p>
          </section>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm">Last updated: August 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
