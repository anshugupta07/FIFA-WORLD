"""
Comprehensive test suite for stadium operations assistant

Tests cover:
- Input sanitization and validation
- Deterministic rule-based responses
- Pattern matching across all venue operation categories
- Error handling and edge cases
- API endpoint validation
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.assistant import sanitize_prompt, sanitize_image_url, build_reply, get_assistant_reply

client = TestClient(app)


# ============================================================================
# Input Sanitization Tests
# ============================================================================

def test_sanitize_prompt_trims_whitespace():
    """Test that prompt is trimmed correctly"""
    result = sanitize_prompt('  Help a wheelchair user  ')
    assert result == 'help a wheelchair user'
    assert not result.startswith(' ')
    assert not result.endswith(' ')


def test_sanitize_prompt_normalizes_whitespace():
    """Test that multiple spaces are normalized to single space"""
    result = sanitize_prompt('Help  a  wheelchair  user')
    assert result == 'help a wheelchair user'
    assert '  ' not in result


def test_sanitize_prompt_enforces_max_length():
    """Test that prompt is truncated to MAX_PROMPT_LENGTH"""
    long_prompt = 'x' * 1000
    result = sanitize_prompt(long_prompt)
    assert len(result) == 240


def test_sanitize_prompt_handles_none():
    """Test that None input returns empty string"""
    assert sanitize_prompt(None) == ''


def test_sanitize_prompt_converts_to_lowercase():
    """Test case conversion"""
    result = sanitize_prompt('HELP A WHEELCHAIR USER')
    assert result == 'help a wheelchair user'
    assert result == result.lower()


def test_sanitize_image_url_accepts_valid_https():
    """Test that valid HTTPS URLs are accepted"""
    url = 'https://example.com/image.jpg'
    assert sanitize_image_url(url) == url


def test_sanitize_image_url_accepts_valid_http():
    """Test that valid HTTP URLs are accepted"""
    url = 'http://example.com/image.jpg'
    assert sanitize_image_url(url) == url


def test_sanitize_image_url_rejects_javascript():
    """Test that javascript: protocol is rejected (XSS prevention)"""
    assert sanitize_image_url('javascript:alert(1)') == ''


def test_sanitize_image_url_rejects_data_urls():
    """Test that data: protocol is rejected"""
    assert sanitize_image_url('data:image/png;base64,iVBORw0K...') == ''


def test_sanitize_image_url_enforces_max_length():
    """Test that URLs exceeding max length are rejected"""
    long_url = 'https://example.com/' + ('x' * 2000)
    assert sanitize_image_url(long_url) == ''


def test_sanitize_image_url_handles_none():
    """Test that None returns empty string"""
    assert sanitize_image_url(None) == ''


def test_sanitize_image_url_handles_empty_string():
    """Test that empty string returns empty string"""
    assert sanitize_image_url('') == ''


# ============================================================================
# Rule-Based Response Tests
# ============================================================================

def test_build_reply_accessibility_query():
    """Test accessibility-related query"""
    reply = build_reply('help a wheelchair user')
    assert 'accessible route' in reply.lower() or 'accessibility' in reply.lower()
    assert 'wheelchair' in reply.lower() or 'accessible' in reply.lower()


def test_build_reply_transit_query():
    """Test transit-related query"""
    reply = build_reply('suggest transit options')
    assert 'transit' in reply.lower() or 'metro' in reply.lower()


def test_build_reply_sustainability_query():
    """Test sustainability-related query"""
    reply = build_reply('eco friendly options')
    assert 'sustainability' in reply.lower() or 'eco' in reply.lower() or 'electric' in reply.lower()


def test_build_reply_crowd_query():
    """Test crowd management query"""
    reply = build_reply('manage crowd at gate b')
    assert 'crowd' in reply.lower() or 'reroute' in reply.lower() or 'gate' in reply.lower()


def test_build_reply_default_response():
    """Test default response for unmatched query"""
    reply = build_reply('random unrelated query')
    assert len(reply) > 0
    assert isinstance(reply, str)


def test_build_reply_case_insensitive():
    """Test that matching is case-insensitive"""
    reply_lower = build_reply('accessibility')
    reply_upper = build_reply('ACCESSIBILITY')
    assert 'accessible' in reply_lower.lower()
    assert 'accessible' in reply_upper.lower()


# ============================================================================
# API Endpoint Tests
# ============================================================================

def test_api_assistant_basic_request():
    """Test basic assistant API request"""
    response = client.post('/v1/assistant', json={'prompt': 'Suggest a transit route'})
    assert response.status_code == 200
    data = response.json()
    assert 'reply' in data
    assert 'source' in data
    assert isinstance(data['reply'], str)
    assert data['reply'] != ''


def test_api_assistant_with_image_url():
    """Test API with valid image URL"""
    response = client.post(
        '/v1/assistant',
        json={
            'prompt': 'Help with crowd',
            'imageUrl': 'https://example.com/crowd.jpg'
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert 'Image' in data['reply'] or 'image' in data['reply']


def test_api_rejects_non_string_prompt():
    """Test that non-string prompts are rejected"""
    response = client.post('/v1/assistant', json={'prompt': 123})
    # Pydantic validation returns 422, not 400
    assert response.status_code in [400, 422]


def test_api_rejects_long_prompt():
    """Test that prompts exceeding max length are rejected"""
    long_prompt = 'x' * 2000
    response = client.post('/v1/assistant', json={'prompt': long_prompt})
    # Pydantic validation returns 422, not 413
    assert response.status_code in [413, 422]


def test_api_rejects_missing_prompt():
    """Test that missing prompt is rejected"""
    response = client.post('/v1/assistant', json={})
    assert response.status_code in [400, 422]  # Validation error


def test_api_accepts_empty_image_url():
    """Test that empty image URL is handled gracefully"""
    # Use a valid prompt (min_length=1)
    response = client.post(
        '/v1/assistant',
        json={'prompt': 'Help with accessibility', 'imageUrl': ''}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'reply' in data


def test_api_response_structure():
    """Test that API response has correct structure"""
    response = client.post('/v1/assistant', json={'prompt': 'accessibility help'})
    assert response.status_code == 200
    data = response.json()
    assert 'reply' in data
    assert 'source' in data
    assert data['source'] in ['rules', 'gemini', None]


# ============================================================================
# Integration Tests
# ============================================================================

def test_get_assistant_reply_accessibility():
    """Test assistant reply for accessibility query"""
    # Note: Testing through API instead of direct async call for better coverage
    response = client.post('/v1/assistant', json={'prompt': 'help a wheelchair user'})
    assert response.status_code == 200
    result = response.json()
    assert 'reply' in result
    assert 'source' in result
    assert isinstance(result['reply'], str)
    assert len(result['reply']) > 0


def test_get_assistant_reply_with_image():
    """Test assistant reply with image URL"""
    response = client.post(
        '/v1/assistant',
        json={
            'prompt': 'crowd management',
            'imageUrl': 'https://example.com/crowd.jpg'
        }
    )
    assert response.status_code == 200
    result = response.json()
    assert 'reply' in result
    assert 'Image' in result['reply'] or 'image' in result['reply']


def test_get_assistant_reply_empty_prompt():
    """Test assistant with empty prompt"""
    response = client.post('/v1/assistant', json={'prompt': ''})
    # Empty prompt should be rejected by Pydantic validation (min_length=1)
    assert response.status_code in [400, 422]


# ============================================================================
# Health Check Test
# ============================================================================

def test_health_check_endpoint():
    """Test health check endpoint for monitoring"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ok'
