import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { address } = await request.json();
    const faucetUrl = 'https://citrea.xyz/api/faucet'; // Correct API endpoint
    console.log('Faucet request for address:', address);
    
    const response = await axios.post(
      faucetUrl,
      { address },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://citrea.xyz'
        }
      }
    );
    
    console.log('Faucet response:', response.data);
    
    // Handle actual response format from Citrea
    if (response.data && response.data.success) {
      return Response.json({ 
        success: true, 
        message: response.data.message || 'Test BTC requested successfully'
      });
    } else {
      return Response.json({ 
        success: false, 
        error: response.data?.error || 'Faucet request failed'
      }, { status: 400 });
    }
  } catch (error) {
    // Handle axios errors
    let errorMessage = 'Network error - please try again';
    
    if (error.response) {
      // Handle HTML responses
      if (error.response.headers['content-type']?.includes('text/html')) {
        errorMessage = 'Faucet API returned HTML instead of JSON. Please check the endpoint.';
      } 
      // Handle actual error responses
      else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Faucet error:', errorMessage);
    return Response.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}