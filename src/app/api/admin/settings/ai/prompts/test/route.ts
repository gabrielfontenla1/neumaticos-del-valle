/**
 * API endpoint for testing AI prompts
 * POST /api/admin/settings/ai/prompts/test - Test prompt with OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/admin/settings/ai/prompts/test
 * Test a prompt with OpenAI to see how it responds
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();
    const { systemPrompt, testMessage } = body;

    if (!systemPrompt || !testMessage) {
      return NextResponse.json(
        { error: 'systemPrompt y testMessage son requeridos' },
        { status: 400 }
      );
    }

    // Test the prompt with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      response,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (error) {
    console.error('[AI Prompts Test] Error:', error);

    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'Error de OpenAI',
          details: error.message,
          type: error.type,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
