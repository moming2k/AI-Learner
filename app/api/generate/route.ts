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
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
