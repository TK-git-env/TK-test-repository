import copy

import pytest

import src.app as app_module


@pytest.fixture(autouse=True)
def reset_app_state():
    original_activities = copy.deepcopy(app_module.activities)
    app_module.activities = copy.deepcopy(original_activities)
    yield
    app_module.activities = copy.deepcopy(original_activities)
