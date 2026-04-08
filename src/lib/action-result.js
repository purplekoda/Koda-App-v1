/**
 * Structured result helpers for Server Actions.
 * Prevents leaking raw errors/stack traces to the client.
 */
export function ok(data = null) {
  return { success: true, data, error: null }
}

export function fail(error = 'Something went wrong') {
  return { success: false, data: null, error }
}
