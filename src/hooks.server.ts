import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { serializeNonPOJOs } from '$lib/utils/object';

const defaultBaseUrl = 'http://127.0.0.1:8090';

export const handle: Handle = async ({ event, resolve }) => {
  const pb = new PocketBase(env.POCKETBASE_URL ?? defaultBaseUrl);
  pb.authStore.loadFromCookie(event.request.headers.get('cookie') ?? '');

  event.locals.pb = pb;
  event.locals.user = pb.authStore.isValid ? serializeNonPOJOs(pb.authStore.model) : null;

  const response = await resolve(event);

  response.headers.append(
    'set-cookie',
    pb.authStore.exportToCookie({
      httpOnly: true,
      secure: event.url.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
    })
  );

  return response;
};
