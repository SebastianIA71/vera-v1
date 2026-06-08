import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Helper centralizado para validación de requests
//
// Uso en endpoints:
//
//   export async function POST(req: NextRequest) {
//     const data = await validateRequest(req, createTaskSchema);
//     if (data instanceof NextResponse) return data; // error
//
//     // data es validado y tipo-safe
//     const task = await createTask(data);
//     return NextResponse.json(task);
//   }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el body JSON de un request contra un schema Zod.
 *
 * @param req - NextRequest
 * @param schema - Zod schema para validar
 * @returns Datos validados tipo-safe O NextResponse con error 400
 */
export async function validateRequest<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<T['_output'] | NextResponse> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return validated;
  } catch (err) {
    if (err instanceof ZodError) {
      const firstError = err.issues[0];
      const message = `${firstError.path.join('.')}: ${firstError.message}`;
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    // JSON parse error
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    // Otro error inesperado
    console.error('[Validation]', err);
    return NextResponse.json(
      { error: 'Error procesando request' },
      { status: 400 }
    );
  }
}

/**
 * Valida query parameters contra un schema Zod.
 */
export function validateQuery<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema
): T | { error: string } {
  try {
    const validated = schema.parse(params);
    return validated as T;
  } catch (err) {
    if (err instanceof ZodError) {
      const firstError = err.issues[0];
      return {
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { error: 'Error validando parámetros' };
  }
}

/**
 * Retorna un error de validación como NextResponse.
 */
export function validationError(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}
