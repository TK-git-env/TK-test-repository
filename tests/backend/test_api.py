from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_list_activities_returns_activity_catalog():
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert payload["Chess Club"]["description"].startswith("Learn strategies")
    assert payload["Chess Club"]["participants"][0] == "michael@mergington.edu"


def test_signup_for_activity_adds_participant():
    activity_name = "Chess Club"
    email = "new-student@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"

    participants = client.get("/activities").json()[activity_name]["participants"]
    assert email in participants


def test_duplicate_signup_is_rejected():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    assert response.status_code == 400
    assert response.json()["detail"] == "This email is already registered for this activity"


def test_unregister_participant_removes_participant():
    activity_name = "Chess Club"
    participant = "michael@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/participants/{participant}")

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant} from {activity_name}"

    updated_participants = client.get("/activities").json()[activity_name]["participants"]
    assert participant not in updated_participants
