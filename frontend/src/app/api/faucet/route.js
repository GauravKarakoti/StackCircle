export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { address } = await request.json();
    const faucetUrl = 'https://citrea.xyz/faucet';
    
    // Use text instead of json to handle non-JSON responses
    const response = await fetch(faucetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://citrea.xyz'
      },
      body: JSON.stringify({ address })
    });
    
    // Handle both text and JSON responses
    const responseText = await response.text();
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(responseText);
      return Response.json(jsonData);
    } catch {
      // Handle non-JSON responses
      if (responseText.includes("successful") || response.ok) {
        return Response.json({ 
          success: true, 
          message: "Test BTC requested successfully"
        });
      } else {
        return Response.json({ 
          success: false, 
          error: responseText || 'Faucet request failed' 
        }, { status: 500 });
      }
    }
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message || 'Network error' 
    }, { status: 500 });
  }
}