import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user1: string; user2: string }> }
) {
  try {
    const { user1: user1Name, user2: user2Name } = await params;
    
    // Fetch mash data (with error handling)
    let score = 0;
    let sharedCount = 0;
    
    try {
      const baseUrl = request.nextUrl.origin;
      const mashResponse = await fetch(`${baseUrl}/api/matching/${user1Name}/${user2Name}`, {
        cache: 'no-store',
      });
      
      if (mashResponse.ok) {
        const mashData = await mashResponse.json();
        const mashResult = mashData.mashResult;
        score = mashResult?.score || 0;
        sharedCount = mashResult?.sharedCount || 0;
      }
    } catch (error) {
      console.error('Error fetching mash data for OG image:', error);
      // Use defaults if fetch fails
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #000 0%, #1a0a1a 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '20px',
              }}
            >
              kindred
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#e879f9',
                marginBottom: '10px',
              }}
            >
              @{user1Name} × @{user2Name}
            </div>
          </div>

          {/* MashScore Display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '2px solid #8b5cf6',
              borderRadius: '24px',
              padding: '60px 80px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                fontWeight: 'bold',
                color: '#a855f7',
                lineHeight: '1',
                marginBottom: '20px',
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#c084fc',
                marginBottom: '10px',
              }}
            >
              MashScore
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#d8b4fe',
              }}
            >
              {sharedCount} shared items
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: '20px',
              color: '#9ca3af',
              marginTop: 'auto',
            }}
          >
            Connect through what you love
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

