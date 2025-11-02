import { NextRequest, NextResponse } from 'next/server';

// Disable Next.js static optimization for this route to allow concurrent requests
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = false } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    const apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5';

    const requestPayload: Record<string, unknown> = {
      model,
      messages,
      response_format: { type: 'json_object' },
      max_completion_tokens: 8000, // Reduced from 16000 for faster responses
      stream,
    };

    if (!model.startsWith('gpt-5')) {
      requestPayload.temperature = 0.7;
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate content' },
          { status: response.status }
        );
      }

      // Handle streaming response
      if (stream && response.body) {
        // Return streaming response as-is
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // Handle non-streaming response (original behavior)
      const data = await response.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;

      if (!choice) {
        console.error('OpenAI response missing choices:', data);
        return NextResponse.json(
          { error: 'OpenAI response did not contain any choices.' },
          { status: 502 }
        );
      }

      if (choice.finish_reason === 'length') {
        console.error('OpenAI response truncated (finish_reason=length):', data);
        return NextResponse.json(
          {
            error:
              'OpenAI response was truncated by the max token limit. Try reducing the prompt or increasing max_completion_tokens.',
          },
          { status: 502 }
        );
      }

      if (typeof content !== 'string' || content.trim().length === 0) {
        console.error('OpenAI response missing content:', data);
        return NextResponse.json(
          { error: 'OpenAI response did not return any content.' },
          { status: 502 }
        );
      }

      try {
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.error('Failed to parse OpenAI JSON response:', parseError, content);
        return NextResponse.json(
          {
            error: 'Failed to parse OpenAI response as JSON. Check the prompt formatting.',
            raw: content,
          },
          { status: 502 }
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('OpenAI request timed out');
        return NextResponse.json(
          { error: 'Request timed out. The AI service took too long to respond.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
