import { allowMethod, clearSessionCookie, setNoStore, type ApiRequest, type ApiResponse } from '../_lib/http';

export default function logout(request: ApiRequest, response: ApiResponse): void {
  setNoStore(response);
  if (!allowMethod(request, response, 'POST')) return;
  clearSessionCookie(response);
  response.status(200).json({ ok: true });
}
