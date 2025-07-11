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
            <footer className="bg-orange-50 py-8 text-center text-gray-600 border-t border-orange-100 mt-8">
              <div className="max-w-6xl mx-auto px-4">
                <p className="mb-3 font-semibold text-orange-600">Built on Citrea — Bitcoin&apos;s First ZK Rollup</p>
                <div className="flex justify-center space-x-8 mb-4">
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
                <p className="text-xs text-gray-400">© {new Date().getFullYear()} StackCircle. All rights reserved.</p>
              </div>
            </footer>
          </CitreaProvider>
        </div>
      </body>
    </html>
  );
}