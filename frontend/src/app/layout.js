import { CitreaProvider } from './contexts/CitreaContext';
import './globals.css';
import Header from './components/Header';

export const metadata = {
  title: 'StackCircle - Bitcoin Social Savings',
  description: 'Save Bitcoin together with friends and communities',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <CitreaProvider>
            {/* Use the new Header component */}
            <Header />
            
            {/* Main Content */}
            <main className="flex-grow">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="bg-gradient-to-r from-orange-50 to-amber-50 py-10 text-center text-gray-600 border-t border-orange-200 mt-12">
              <div className="max-w-6xl mx-auto px-4">
                <p className="mb-4 font-bold text-orange-600 text-lg">Built on Citrea — Bitcoin&apos;s First ZK Rollup</p>
                <div className="flex flex-wrap justify-center space-x-8 gap-6 mb-6">
                  <a href="https://docs.citrea.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                    <span>📄</span><span>Documentation</span>
                  </a>
                  <a href="https://github.com/GauravKarakoti" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                    <span>💻</span><span>GitHub</span>
                  </a>
                  <a href="https://discord.com/invite/citrea" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                    <span>💬</span><span>Support</span>
                  </a>
                </div>
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold">C</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    Powered by Citrea Chain
                  </div>
                </div>
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} StackCircle. All rights reserved.</p>
              </div>
            </footer>
          </CitreaProvider>
        </div>
      </body>
    </html>
  );
}