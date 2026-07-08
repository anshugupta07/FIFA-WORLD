import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.assistant import sanitize_prompt, sanitize_image_url, build_reply

client = TestClient(app)


def test_sanitize_prompt_and_build_reply():
    s = sanitize_prompt('  Help a wheelchair user  ')
    assert s == 'Help a wheelchair user'
    r = build_reply(s)
    assert 'Accessible route' in r or 'access' in r.lower()


def test_sanitize_image_url():
    assert sanitize_image_url('https://example.com/a.jpg') == 'https://example.com/a.jpg'
    assert sanitize_image_url('javascript:alert(1)') == ''


def test_api_assistant_basic():
    resp = client.post('/v1/assistant', json={'prompt': 'Suggest a transit route'})
    assert resp.status_code == 200
    data = resp.json()
    assert 'Transit recommendation' in data['reply'] or 'Transit' in data['reply']


def test_api_rejects_long_prompt():
    long = 'x' * 2000
    resp = client.post('/v1/assistant', json={'prompt': long})
    assert resp.status_code == 413
