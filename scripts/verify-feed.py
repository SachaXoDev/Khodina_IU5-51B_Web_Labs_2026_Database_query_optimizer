#!/usr/bin/env python3
"""Verify pagination and Redis feed on an isolated Nest demo. No secrets in output."""
import argparse
import http.cookiejar
import json
import secrets
import subprocess
import urllib.request
from urllib.parse import urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api', default='http://127.0.0.1:3108')
    parser.add_argument('--redis-port', type=int, default=6398)
    args = parser.parse_args()
    origin = urlsplit(args.api)
    if origin.scheme != 'http' or origin.hostname != '127.0.0.1' or origin.username or origin.path not in ('', '/') or origin.query or origin.fragment:
        parser.error('Use only the loopback address of the isolated demo')
    api = args.api.rstrip('/') + '/api'

    def redis(*command):
        return subprocess.check_output(['redis-cli', '-h', '127.0.0.1', '-p', str(args.redis_port), '--raw', *command], text=True).strip()

    def client():
        jar = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(jar))

        def request(path, payload=None):
            body = None if payload is None else json.dumps(payload).encode()
            req = urllib.request.Request(api + path, data=body, headers={'Content-Type': 'application/json'})
            with opener.open(req, timeout=10) as response:
                return json.load(response)

        return jar, request

    def snapshot(key, response, position):
        raw = redis('GET', key)
        if not raw:
            raise SystemExit('Партия не найдена. Укажите REDIS_PORT используемого NestJS стенда через --redis-port.')
        state = json.loads(raw)
        assert len(state['ids']) == len(set(state['ids'])) == response['batchSize'] == 100
        assert state['cursor'] + 1 == response['position'] == position
        assert state['ids'][position - 1] == response['current']['id']
        return state

    jar, guest = client()
    first = guest('/indexes?minCardinality=420042&limit=24&offset=0')
    second = guest('/indexes?minCardinality=420042&limit=24&offset=24')
    assert first['total'] == second['total'] == 750
    assert {row['id'] for row in first['items']}.isdisjoint(row['id'] for row in second['items'])
    assert all(len(page['items']) == 24 and all(row['cardinality'] == 420042 for row in page['items']) for page in (first, second))
    capped = guest('/indexes?minCardinality=420042&limit=101')
    assert capped['limit'] == len(capped['items']) == 100
    print('Каталог: 750 совпадений, две разные страницы по 24, предел 100.')

    feed = '/indexes/feed'
    response = guest(feed)
    guest_key = 'feed:guest:' + next(cookie.value for cookie in jar if cookie.name == 'feedGuestId')
    user_key = None
    try:
        first_state = snapshot(guest_key, response, 1)
        polled = guest(f'{feed}?id={response["current"]["id"]}')
        assert snapshot(guest_key, polled, 1) == first_state
        print(f'Redis, гость: позиция 1, 100 ID из 100 уникальны; первые пять ID: {first_state["ids"][:5]}.')
        for position in range(2, 101):
            response = guest(f'{feed}?next=true&id={response["current"]["id"]}')
            assert response['position'] == position
        assert snapshot(guest_key, response, 100)['ids'] == first_state['ids']
        last_id = response['current']['id']
        response = guest(f'{feed}?next=true&id={last_id}')
        second_state = snapshot(guest_key, response, 1)
        assert second_state['revision'] != first_state['revision'] and second_state['ids'] != first_state['ids']
        assert second_state['ids'][0] != last_id
        print(f'Redis, гость: 100 → 1, новая партия, 100 уникальных ID; первые пять: {second_state["ids"][:5]}.')
        _, author = client()
        credentials = {'username': 'feed_check_' + secrets.token_hex(6), 'password': secrets.token_urlsafe(24)}
        author('/auth/register', credentials)
        author('/auth/login', credentials)
        user_key = f'feed:user:{author("/auth/me")["id"]}'
        signed = snapshot(user_key, author(feed), 1)
        assert signed['revision'] != second_state['revision']
        assert json.loads(redis('GET', guest_key)) == second_state
        author('/auth/logout', {})
        print(f'Redis, вошедший: отдельная партия, 100 уникальных ID; первые пять: {signed["ids"][:5]}. Гостевая партия не изменилась.')
    finally:
        redis('DEL', guest_key, *([user_key] if user_key else []))


if __name__ == '__main__':
    main()
