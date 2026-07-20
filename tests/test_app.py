from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_unregister_participant_from_activity():
    activity_name = "Chess Club"
    participant = "michael@mergington.edu"

    initial_participants = client.get("/activities").json()[activity_name]["participants"]
    assert participant in initial_participants

    response = client.delete(f"/activities/{activity_name}/participants/{participant}")

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant} from {activity_name}"

    updated_participants = client.get("/activities").json()[activity_name]["participants"]
    assert participant not in updated_participants


def test_duplicate_signup_is_rejected():
    activity_name = "Chess Club"
    participant = "duplicate-check@mergington.edu"

    first_response = client.post(f"/activities/{activity_name}/signup?email={participant}")
    duplicate_response = client.post(f"/activities/{activity_name}/signup?email={participant}")

    assert first_response.status_code == 200
    assert duplicate_response.status_code == 400
    assert duplicate_response.json()["detail"] == "This email is already registered for this activity"
