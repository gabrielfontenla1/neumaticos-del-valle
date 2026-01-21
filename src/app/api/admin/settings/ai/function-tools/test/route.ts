/**
 * API endpoint for testing function tools
 * POST /api/admin/settings/ai/function-tools/test - Test function tool with OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import { validateFunctionSchema } from '@/lib/ai/config-validators';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/admin/settings/ai/function-tools/test
 * Test a function tool schema with OpenAI to see if it works
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();
    const { functionTool, testMessage } = body;

    if (!functionTool || !testMessage) {
      return NextResponse.json(
        { error: 'functionTool y testMessage son requeridos' },
        { status: 400 }
      );
    }

    // Validate function schema
    const schemaValidation = validateFunctionSchema(functionTool.parameters);
    if (!schemaValidation.valid) {
      return NextResponse.json(
        {
          error: 'Esquema de función inválido',
          details: schemaValidation.error,
        },
        { status: 400 }
      );
    }

    // Test the function with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sos un asistente que puede usar funciones para ayudar al usuario.',
        },
        { role: 'user', content: testMessage },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: functionTool.name,
            description: functionTool.description,
            parameters: functionTool.parameters,
          },
        },
      ],
      tool_choice: 'auto',
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls;

    // Check if function was called
    if (toolCalls && toolCalls.length > 0) {
      const functionCall = toolCalls[0];
      // Type guard for function tool calls
      if (functionCall.type === 'function') {
        return NextResponse.json({
          success: true,
          functionCalled: true,
          functionName: functionCall.function.name,
          arguments: JSON.parse(functionCall.function.arguments),
          usage: completion.usage,
          model: completion.model,
        });
      }
    }

    // Function was not called
    return NextResponse.json({
      success: true,
      functionCalled: false,
      response: message?.content || '',
      reason:
        'La función no fue invocada. Prueba con un mensaje más específico que requiera usar esta función.',
      usage: completion.usage,
      model: completion.model,
    });
  } catch (error) {
    console.error('[Function Tools Test] Error:', error);

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
