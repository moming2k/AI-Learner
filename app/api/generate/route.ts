import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

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
      max_completion_tokens: 2000,
    };

    if (!model.startsWith('gpt-5')) {
      requestPayload.temperature = 0.7;
    }

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
