import axios from 'axios';

/**
 * Next.js API Route Handler for creating a circle.
 * This route acts as a proxy to the main backend server.
 * It takes the request from the frontend, forwards it to the Express backend,
 * and then returns the backend's response to the frontend.
 */
export async function POST(req) {
  // 1. Get the URL of your dedicated backend server from environment variables.
//   const backendUrl = "http://localhost:5001";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error("🔥 BACKEND_URL environment variable not set.");
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Get the request body from the frontend call.
    const body = await req.json();
    console.log("➡️ Forwarding /api/create-circle request to backend:", body);

    // 3. Make a POST request to your Express backend server.
    const backendResponse = await axios.post(`${backendUrl}/api/create-circle`, body);

    // 4. Return the response from the backend directly to the frontend.
    // The status code and data from the backend are preserved.
    return new Response(JSON.stringify(backendResponse.data), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 5. Handle any errors that occur during the proxy request.
    // This could be a network error or an error response from the backend (e.g., 400, 500).
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to connect to backend service.';
    
    console.error(`🔥 Error proxying to backend (Status: ${status}):`, message);

    return new Response(JSON.stringify({ error: message }), {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}