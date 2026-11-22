import { ensureSchema } from '../_lib/db';
import { allowMethod, authenticatedUser, handleApiError, setNoStore, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function me(request: ApiRequest, response: ApiResponse): Promise<void> {
  setNoStore(response);
  if (!allowMethod(request, response, 'GET')) return;
  try {
    await ensureSchema();
    response.status(200).json({ user: await authenticatedUser(request) });
  } catch (error) {
    handleApiError(error, response);
  }
}
