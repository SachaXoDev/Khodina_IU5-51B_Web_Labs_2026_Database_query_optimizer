import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SessionService } from '../session/session.service';

export const FEED_BATCH_SIZE = 100;
export const FEED_GUEST_COOKIE = 'feedGuestId';
export const FEED_TTL_SECONDS = 7 * 24 * 60 * 60;

interface FeedState {
  ids: number[];
  cursor: number;
  revision: string;
}

const COMPARE_AND_SET = `
local existing = redis.call('GET', KEYS[1])
if (existing or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1`;

@Injectable()
export class FeedStateService {
  constructor(private readonly sessions: SessionService) {}

  async poll(key: string, id: number) {
    const raw = await this.sessions.getClient().get(key);
    const state = raw ? (JSON.parse(raw) as FeedState) : null;
    const match = state?.ids.indexOf(id) ?? -1;
    return { position: match < 0 ? null : match + 1, batchSize: state?.ids.length ?? 0 };
  }

  async select(
    key: string,
    advance: boolean,
    expectedId: number | undefined,
    sample: () => Promise<number[]>,
  ): Promise<{ id: number | null; position: number | null; batchSize: number }> {
    const redis = this.sessions.getClient();
    for (let attempt = 0; attempt < 16; attempt++) {
      const raw = await redis.get(key);
      const state = raw ? (JSON.parse(raw) as FeedState) : null;
      const currentId = state?.ids[state.cursor];

      // An explicit id also acts as a compare token for repeated Next requests.
      if (state && currentId !== undefined && (!advance || (expectedId !== undefined && (expectedId !== currentId || attempt > 0)))) {
        return { id: currentId, position: state.cursor + 1, batchSize: state.ids.length };
      }

      let ids: number[];
      let cursor: number;
      if (state && state.cursor + 1 < state.ids.length) {
        ids = state.ids;
        cursor = state.cursor + 1;
      } else {
        ids = await sample();
        cursor = 0;
        if (ids.length === 0) return { id: null, position: null, batchSize: 0 };
        // Don't repeat the last card immediately at a batch boundary, if possible.
        if (ids.length > 1 && ids[0] === currentId) [ids[0], ids[1]] = [ids[1], ids[0]];
      }

      const replacement: FeedState = { ids, cursor, revision: randomUUID() };
      const saved = await redis.eval(COMPARE_AND_SET, 1, key, raw ?? '', JSON.stringify(replacement), FEED_TTL_SECONDS);
      if (saved === 1) return { id: ids[cursor], position: cursor + 1, batchSize: ids.length };
    }

    throw new ServiceUnavailableException('Лента занята, попробуйте снова');
  }
}
