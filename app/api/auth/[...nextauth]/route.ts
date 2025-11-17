import NextAuth from "next-auth";
import { getFrontendOrigin } from "@/lib/utils";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

// Create NextAuth instance with dynamic URL configuration
const createNextAuthHandlers = () => {
  return NextAuth(authOptions);
};

const { handlers: baseHandlers, auth, signIn, signOut } = createNextAuthHandlers();

// Wrap handlers to ensure they use the frontend origin from request headers
export const GET = async (request: NextRequest) => {
  // Get frontend origin from request headers
  const frontendOrigin = getFrontendOrigin(request);
  
  // Create a modified request with the correct origin
  if (frontendOrigin) {
    try {
      const frontendUrl = new URL(frontendOrigin);
      const requestUrl = new URL(request.url);
      
      // Create a new URL with the frontend host but preserving the path
      const modifiedUrl = new URL(requestUrl.pathname + requestUrl.search, frontendOrigin);
      
      // Create headers with the correct host
      const headers = new Headers(request.headers);
      headers.set('host', frontendUrl.host);
      headers.set('x-forwarded-host', frontendUrl.host);
      headers.set('x-forwarded-proto', frontendUrl.protocol.slice(0, -1)); // Remove trailing ':'
      
      const modifiedRequest = new NextRequest(modifiedUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });
      
      return baseHandlers.GET(modifiedRequest);
    } catch (error) {
      console.error('Error modifying request for NextAuth:', error);
      // Fall back to original request
      return baseHandlers.GET(request);
    }
  }
  
  return baseHandlers.GET(request);
};

export const POST = async (request: NextRequest) => {
  // Get frontend origin from request headers
  const frontendOrigin = getFrontendOrigin(request);
  
  // Create a modified request with the correct origin
  if (frontendOrigin) {
    try {
      const frontendUrl = new URL(frontendOrigin);
      const requestUrl = new URL(request.url);
      
      // Create a new URL with the frontend host but preserving the path
      const modifiedUrl = new URL(requestUrl.pathname + requestUrl.search, frontendOrigin);
      
      // Create headers with the correct host
      const headers = new Headers(request.headers);
      headers.set('host', frontendUrl.host);
      headers.set('x-forwarded-host', frontendUrl.host);
      headers.set('x-forwarded-proto', frontendUrl.protocol.slice(0, -1)); // Remove trailing ':'
      
      const modifiedRequest = new NextRequest(modifiedUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });
      
      return baseHandlers.POST(modifiedRequest);
    } catch (error) {
      console.error('Error modifying request for NextAuth:', error);
      // Fall back to original request
      return baseHandlers.POST(request);
    }
  }
  
  return baseHandlers.POST(request);
};

export { auth, signIn, signOut };
