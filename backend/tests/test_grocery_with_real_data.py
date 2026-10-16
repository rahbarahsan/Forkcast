def test_seeded_catalog_generates_list_without_services(client):
    recipes = client.get('/api/recipes').json()
    result = client.post('/api/grocery-list', json={'recipe_ids':[r['id'] for r in recipes]})
    assert result.status_code == 200
    assert result.json()['categorized']
    assert 'garlic' in result.json()['raw']
